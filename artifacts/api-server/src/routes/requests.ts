import crypto from "crypto";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  db,
  groupsTable,
  requestInvitationsTable,
  requestsTable,
  usersTable,
} from "@workspace/db";
import { track } from "../lib/analytics";
import { requireAuth } from "../middlewares/requireAuth";
import { normalizeEmail } from "../lib/auth";
import { sendFriendInvitationEmail } from "../lib/email";
import { sendPushToMany } from "../lib/push";

const router = Router();

const CreateRequestBody = z.object({
  meetupType: z.enum(["coffee", "dinner"]),
  preferredDate: z.string(),
  preferredTime: z.enum(["morning", "afternoon", "evening"]),
  area: z.string().min(1),
  venueId: z.string().uuid().optional(),
  friendEmail: z.string().email().optional(),
});

router.get("/", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.userId, req.user!.id))
    .orderBy(requestsTable.createdAt);

  // Attach groupId by checking which group (if any) contains each request in its requestIds array.
  // requestsTable has no groupId column — the link is stored on the group side.
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const [group] = await db
        .select({ id: groupsTable.id })
        .from(groupsTable)
        .where(sql`${r.id} = ANY(${groupsTable.requestIds})`)
        .limit(1);
      const [invite] = await db
        .select()
        .from(requestInvitationsTable)
        .where(eq(requestInvitationsTable.requestId, r.id))
        .limit(1);
      if (!invite) return { ...r, groupId: group?.id ?? null, invitation: null };
      const { tokenHash: _token, ...safeInvite } = invite;
      return { ...r, groupId: group?.id ?? null, invitation: safeInvite };
    }),
  );

  res.json(enriched);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request data" });
    return;
  }

  const existing = await db
    .select()
    .from(requestsTable)
    .where(
      and(
        eq(requestsTable.userId, req.user!.id),
        eq(requestsTable.status, "pending"),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "You already have a pending request" });
    return;
  }

  const friendEmail = parsed.data.friendEmail
    ? normalizeEmail(parsed.data.friendEmail)
    : undefined;
  if (friendEmail && friendEmail === normalizeEmail(req.user!.email ?? "")) {
    res.status(400).json({ error: "You cannot invite yourself" });
    return;
  }

  // Validate known accounts immediately. Unknown email addresses are checked
  // again when the friend signs up/accepts, so invitations can be claimable.
  let invitedUser: typeof req.user | undefined;
  if (friendEmail) {
    const [known] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, friendEmail))
      .limit(1);
    if (known) {
      invitedUser = known;
      if (known.flagged || known.gender !== req.user!.gender || known.city !== req.user!.city) {
        res.status(400).json({ error: "Your friend must be in the same Tal'ah Type and city" });
        return;
      }
      if (
        (req.user!.blockedUserIds ?? []).includes(known.id) ||
        (known.blockedUserIds ?? []).includes(req.user!.id)
      ) {
        res.status(400).json({ error: "This friend cannot be invited" });
        return;
      }
      const [conflict] = await db
        .select({ id: requestsTable.id })
        .from(requestsTable)
        .where(
          and(
            eq(requestsTable.userId, known.id),
            inArray(requestsTable.status, ["pending", "matched"]),
          ),
        )
        .limit(1);
      if (conflict) {
        res.status(400).json({ error: "Your friend already has an active Tal'ah" });
        return;
      }
      const [activeGroup] = await db
        .select({ id: groupsTable.id })
        .from(groupsTable)
        .where(
          and(
            inArray(groupsTable.status, ["pending", "matched", "revealed"]),
            sql`${groupsTable.memberIds} @> ARRAY[${known.id}]::text[]`,
          ),
        )
        .limit(1);
      if (activeGroup) {
        res.status(400).json({ error: "Your friend already has an active Tal'ah" });
        return;
      }
    }
  }

  const [created] = await db
    .insert(requestsTable)
    .values({
      meetupType: parsed.data.meetupType,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      area: parsed.data.area,
      venueId: parsed.data.venueId,
      userId: req.user!.id,
    })
    .returning();

  if (friendEmail) {
    const token = crypto.randomBytes(32).toString("hex");
    const [invite] = await db
      .insert(requestInvitationsTable)
      .values({
        requestId: created.id,
        requesterId: req.user!.id,
        invitedEmail: friendEmail,
        inviteeUserId: invitedUser?.id,
        tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
      .returning();
    void sendFriendInvitationEmail(
      friendEmail,
      req.user!.nickname ?? "Your friend",
      token,
    ).catch((err) => req.log.error({ err }, "Friend invitation email failed"));
    if (invitedUser?.expoPushToken) {
      void sendPushToMany(
        [invitedUser.expoPushToken],
        "لديك دعوة من صديقتك",
        `${req.user!.nickname ?? "صديقتك"} دعتك للانضمام إلى طلعتها`,
        { invitationId: invite.id },
      );
    }
  }

  track("group_requested", req.user!.id, {
    type: parsed.data.meetupType,
    area: parsed.data.area,
  });

  res.status(201).json(created);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const [row] = await db
    .select()
    .from(requestsTable)
    .where(
      and(
        eq(requestsTable.id, req.params["id"] as string),
        eq(requestsTable.userId, req.user!.id),
      ),
    )
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (row.status !== "pending") {
    res.status(400).json({ error: "Only pending requests can be cancelled" });
    return;
  }

  const [cancelled] = await db
    .update(requestsTable)
    .set({ status: "cancelled" })
    .where(and(eq(requestsTable.id, row.id), eq(requestsTable.status, "pending")))
    .returning({ id: requestsTable.id });
  if (!cancelled) {
    res.status(409).json({ error: "This request is no longer open" });
    return;
  }
  await db
    .update(requestInvitationsTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(requestInvitationsTable.requestId, row.id),
        ne(requestInvitationsTable.status, "finalized"),
      ),
    );

  // If this request was part of a group, remove it from the group's membership arrays.
  // If the group drops below 3 members, revert it to "cancelled".
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(sql`${row.id} = ANY(${groupsTable.requestIds})`)
    .limit(1);

  if (group) {
    const updatedMembers = group.memberIds.filter((id) => id !== req.user!.id);
    const updatedRequests = group.requestIds.filter((id) => id !== row.id);
    const newStatus = updatedMembers.length < 3 ? "cancelled" : group.status;
    await db
      .update(groupsTable)
      .set({
        memberIds: updatedMembers,
        requestIds: updatedRequests,
        status: newStatus,
      })
      .where(eq(groupsTable.id, group.id));
  }

  res.json({ ok: true });
});

export default router;
