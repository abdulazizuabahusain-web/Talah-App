import { and, eq, inArray, or } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import {
  contactExchangesTable,
  db,
  feedbackTable,
  groupsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────

type FeedbackConn = { userId: string; verdict: "connect" | "pass" };

async function assertMutualConnect(
  groupId: string,
  userA: string,
  userB: string,
): Promise<boolean> {
  const rows = await db
    .select({ fromUserId: feedbackTable.fromUserId, connections: feedbackTable.connections })
    .from(feedbackTable)
    .where(eq(feedbackTable.groupId, groupId));

  const chooses = (from: string, to: string) =>
    rows.some(
      (r) =>
        r.fromUserId === from &&
        ((r.connections ?? []) as FeedbackConn[]).some(
          (c) => c.userId === to && c.verdict === "connect",
        ),
    );

  return chooses(userA, userB) && chooses(userB, userA);
}

// ── POST /api/connections/exchange ──────────────────────────────────────────
// Opt-in: share a contact value with a mutual connect.
// Idempotent — re-posting updates the contactValue.
router.post("/exchange", requireAuth, async (req, res) => {
  const parsed = z
    .object({
      groupId: z.string().uuid(),
      toUserId: z.string().uuid(),
      contactValue: z.string().min(1).max(300).trim(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { groupId, toUserId, contactValue } = parsed.data;
  const fromUserId = req.user!.id;

  if (fromUserId === toUserId) {
    res.status(400).json({ error: "Cannot exchange with yourself" });
    return;
  }

  // Verify the group exists and both users are members
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId))
    .limit(1);

  if (!group || !group.memberIds.includes(fromUserId) || !group.memberIds.includes(toUserId)) {
    res.status(403).json({ error: "Not a member of this group" });
    return;
  }

  // Verify mutual connect exists
  const mutual = await assertMutualConnect(groupId, fromUserId, toUserId);
  if (!mutual) {
    res.status(403).json({ error: "No mutual connect found for these users" });
    return;
  }

  await db
    .insert(contactExchangesTable)
    .values({ groupId, fromUserId, toUserId, contactValue })
    .onConflictDoUpdate({
      target: [
        contactExchangesTable.groupId,
        contactExchangesTable.fromUserId,
        contactExchangesTable.toUserId,
      ],
      set: { contactValue },
    });

  res.json({ ok: true });
});

// ── GET /api/connections/exchanges ──────────────────────────────────────────
// Returns all exchanges the current user is part of, with mutual status.
router.get("/exchanges", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const rows = await db
    .select()
    .from(contactExchangesTable)
    .where(
      or(
        eq(contactExchangesTable.fromUserId, userId),
        eq(contactExchangesTable.toUserId, userId),
      ),
    );

  // Build a map keyed by `${groupId}:${otherUserId}`
  const map = new Map<
    string,
    {
      groupId: string;
      theirUserId: string;
      myContactValue: string | null;
      theirContactValue: string | null;
    }
  >();

  for (const row of rows) {
    const isSender = row.fromUserId === userId;
    const otherUserId = isSender ? row.toUserId : row.fromUserId;
    const key = `${row.groupId}:${otherUserId}`;
    const entry = map.get(key) ?? {
      groupId: row.groupId,
      theirUserId: otherUserId,
      myContactValue: null,
      theirContactValue: null,
    };
    if (isSender) entry.myContactValue = row.contactValue;
    else entry.theirContactValue = row.contactValue;
    map.set(key, entry);
  }

  // Resolve nicknames
  const otherIds = [...new Set([...map.values()].map((v) => v.theirUserId))];
  const others =
    otherIds.length > 0
      ? await db
          .select({ id: usersTable.id, nickname: usersTable.nickname })
          .from(usersTable)
          .where(inArray(usersTable.id, otherIds))
      : [];
  const nicknameById = new Map(others.map((u) => [u.id, u.nickname]));

  const exchanges = [...map.values()].map((v) => ({
    groupId: v.groupId,
    theirUserId: v.theirUserId,
    theirNickname: nicknameById.get(v.theirUserId) ?? null,
    myContactValue: v.myContactValue,
    theirContactValue: v.theirContactValue,
  }));

  res.json({ exchanges });
});

export default router;
