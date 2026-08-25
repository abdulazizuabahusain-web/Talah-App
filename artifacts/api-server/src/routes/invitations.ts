import crypto from "crypto";
import { and, eq, gt, inArray, lte, or, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  db,
  groupsTable,
  pool,
  requestInvitationsTable,
  requestsTable,
  usersTable,
} from "@workspace/db";
import { normalizeEmail } from "../lib/auth";
import { sendFriendInvitationEmail } from "../lib/email";
import { sendPushToMany } from "../lib/push";
import { requireAuth } from "../middlewares/requireAuth";
import {
  expirePendingInvitations,
  respondToInvitation,
} from "../lib/invitationLifecycle";

const router = Router();
const EXPIRY_MS = 48 * 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function expireInvites() {
  await expirePendingInvitations(pool);
}

async function hardSafetyCheck(requestId: string, inviteeId: string) {
  const [request] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId))
    .limit(1);
  const [requester] = request
    ? await db.select().from(usersTable).where(eq(usersTable.id, request.userId)).limit(1)
    : [];
  const [invitee] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, inviteeId))
    .limit(1);

  if (!request || !requester || !invitee) return "Request or user not found";
  if (request.status !== "pending") return "This request is no longer open";
  if (requester.id === invitee.id) return "You cannot invite yourself";
  if (!requester.gender || requester.gender !== invitee.gender) {
    return "Your friend must be in the same Tal'ah Type";
  }
  if (!requester.city || requester.city !== invitee.city) {
    return "Your friend must be in the same city";
  }
  if (requester.flagged || invitee.flagged) return "This invitation cannot be accepted";
  if (
    (requester.blockedUserIds ?? []).includes(invitee.id) ||
    (invitee.blockedUserIds ?? []).includes(requester.id)
  ) {
    return "This invitation cannot be accepted";
  }

  const conflicting = await db
    .select({ id: requestsTable.id })
    .from(requestsTable)
    .where(
      and(
        eq(requestsTable.userId, invitee.id),
        inArray(requestsTable.status, ["pending", "matched"]),
      ),
    )
    .limit(1);
  if (conflicting.length > 0) return "Your friend already has an active Tal'ah";
  const activeGroup = await db
    .select({ id: groupsTable.id })
    .from(groupsTable)
    .where(
      and(
        inArray(groupsTable.status, ["pending", "matched", "revealed"]),
        sql`${groupsTable.memberIds} @> ARRAY[${invitee.id}]::text[]`,
      ),
    )
    .limit(1);
  if (activeGroup.length > 0) return "Your friend already has an active Tal'ah";
  return null;
}

router.get("/", requireAuth, async (req, res) => {
  await expireInvites();
  const email = req.user!.email ? normalizeEmail(req.user!.email) : null;
  const rows = await db
    .select()
    .from(requestInvitationsTable)
    .where(
      email
        ? or(
            eq(requestInvitationsTable.requesterId, req.user!.id),
            eq(requestInvitationsTable.inviteeUserId, req.user!.id),
            eq(requestInvitationsTable.invitedEmail, email),
          )
        : or(
            eq(requestInvitationsTable.requesterId, req.user!.id),
            eq(requestInvitationsTable.inviteeUserId, req.user!.id),
          ),
    )
    .orderBy(requestInvitationsTable.createdAt);
  res.json(rows.map(({ tokenHash: _token, ...row }) => row));
});

router.post("/claim", requireAuth, async (req, res) => {
  const parsed = z.object({ token: z.string().min(20) }).safeParse(req.body);
  if (!parsed.success || !req.user!.email) {
    res.status(400).json({ error: "A valid invitation token is required" });
    return;
  }
  await expireInvites();
  const [invite] = await db
    .select()
    .from(requestInvitationsTable)
    .where(eq(requestInvitationsTable.tokenHash, hashToken(parsed.data.token)))
    .limit(1);
  if (!invite || invite.invitedEmail !== normalizeEmail(req.user!.email)) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  if (invite.status !== "pending") {
    res.status(409).json({ error: `Invitation is ${invite.status}` });
    return;
  }
  const safetyError = await hardSafetyCheck(invite.requestId, req.user!.id);
  if (safetyError) {
    res.status(400).json({ error: safetyError });
    return;
  }
  const [updated] = await db
    .update(requestInvitationsTable)
    .set({ inviteeUserId: req.user!.id, updatedAt: new Date() })
    .where(
      and(
        eq(requestInvitationsTable.id, invite.id),
        eq(requestInvitationsTable.status, "pending"),
        gt(requestInvitationsTable.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!updated) {
    res.status(409).json({ error: "Invitation is no longer available" });
    return;
  }
  const { tokenHash: _token, ...safe } = updated;
  res.json(safe);
});

router.post("/:id/respond", requireAuth, async (req, res) => {
  const parsed = z.object({ response: z.enum(["accepted", "declined"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Response must be accepted or declined" });
    return;
  }
  await expireInvites();
  const [invite] = await db
    .select()
    .from(requestInvitationsTable)
    .where(eq(requestInvitationsTable.id, req.params["id"] as string))
    .limit(1);
  if (!invite) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  const email = req.user!.email ? normalizeEmail(req.user!.email) : "";
  if (
    invite.invitedEmail !== email &&
    invite.inviteeUserId !== req.user!.id
  ) {
    res.status(403).json({ error: "This invitation is not for you" });
    return;
  }
  if (invite.status !== "pending") {
    res.status(409).json({ error: `Invitation is ${invite.status}` });
    return;
  }
  if (parsed.data.response === "accepted") {
    const safetyError = await hardSafetyCheck(invite.requestId, req.user!.id);
    if (safetyError) {
      res.status(400).json({ error: safetyError });
      return;
    }
  }
  const wasUpdated = await respondToInvitation(
    pool,
    invite.id,
    req.user!.id,
    parsed.data.response,
  );
  if (!wasUpdated) {
    res.status(409).json({ error: "Invitation is no longer available" });
    return;
  }
  const [updated] = await db
    .select()
    .from(requestInvitationsTable)
    .where(eq(requestInvitationsTable.id, invite.id))
    .limit(1);
  const { tokenHash: _token, ...safe } = updated;
  res.json(safe);
});

export default router;