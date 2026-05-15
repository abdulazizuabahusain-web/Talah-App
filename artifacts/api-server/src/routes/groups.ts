import { and, eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import { db, feedbackTable, groupsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function embedMembers(memberIds: string[]) {
  if (memberIds.length === 0) return [];
  const rows = await db
    .select({
      id: usersTable.id,
      nickname: usersTable.nickname,
      gender: usersTable.gender,
      ageRange: usersTable.ageRange,
      lifestyle: usersTable.lifestyle,
      personality: usersTable.personality,
      verified: usersTable.verified,
      funFact: usersTable.funFact,
      personalityTraits: usersTable.personalityTraits,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, memberIds));
  return rows;
}

router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const rows = await db
    .select()
    .from(groupsTable)
    .where(sql`${groupsTable.memberIds} @> ARRAY[${userId}]::text[]`)
    .orderBy(groupsTable.createdAt);

  const withMembers = await Promise.all(
    rows.map(async (g) => ({
      ...g,
      members: await embedMembers(g.memberIds),
    })),
  );

  res.json(withMembers);
});

// GET /connections — all mutual connects across every completed group the user belongs to
router.get("/connections", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const myGroups = await db
    .select()
    .from(groupsTable)
    .where(
      and(
        sql`${groupsTable.memberIds} @> ARRAY[${userId}]::text[]`,
        eq(groupsTable.status, "completed"),
      ),
    )
    .orderBy(groupsTable.meetupAt);

  if (myGroups.length === 0) {
    res.json({ connections: [] });
    return;
  }

  const groupIds = myGroups.map((g) => g.id);
  const allFeedback = await db
    .select({ groupId: feedbackTable.groupId, fromUserId: feedbackTable.fromUserId, connections: feedbackTable.connections })
    .from(feedbackTable)
    .where(inArray(feedbackTable.groupId, groupIds));

  type Connection = { userId: string; verdict: "connect" | "pass" };

  const result: {
    groupId: string;
    meetupType: string | null;
    city: string | null;
    meetupAt: number | null;
    mutualConnects: { id: string; nickname: string | null; personalityTraits: string[] }[];
  }[] = [];

  for (const group of myGroups) {
    const groupFeedback = allFeedback.filter((f) => f.groupId === group.id);
    const connectsFrom = new Map<string, Set<string>>();
    for (const row of groupFeedback) {
      const conns = (row.connections ?? []) as Connection[];
      const chosen = new Set(conns.filter((c) => c.verdict === "connect").map((c) => c.userId));
      connectsFrom.set(row.fromUserId, chosen);
    }

    const requesterChoices = connectsFrom.get(userId) ?? new Set<string>();
    const mutualIds = group.memberIds.filter(
      (id) => id !== userId && requesterChoices.has(id) && (connectsFrom.get(id)?.has(userId) ?? false),
    );

    if (mutualIds.length > 0) {
      const members = await db
        .select({ id: usersTable.id, nickname: usersTable.nickname, personalityTraits: usersTable.personalityTraits })
        .from(usersTable)
        .where(inArray(usersTable.id, mutualIds));
      result.push({ groupId: group.id, meetupType: group.meetupType, city: group.city, meetupAt: group.meetupAt ?? null, mutualConnects: members });
    }
  }

  res.json({ connections: result });
});

router.get("/:id", requireAuth, async (req, res) => {
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, req.params["id"] as string))
    .limit(1);

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  if (!group.memberIds.includes(req.user!.id)) {
    res.status(403).json({ error: "Not a member of this group" });
    return;
  }

  const members = await embedMembers(group.memberIds);
  res.json({ ...group, members });
});

// GET /groups/:id/mutual-connects
// Returns members who mutually chose "connect" with the requesting user.
router.get("/:id/mutual-connects", requireAuth, async (req, res) => {
  const groupId = req.params["id"] as string;
  const requesterId = req.user!.id;

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId))
    .limit(1);

  if (!group) { res.status(404).json({ error: "Group not found" }); return; }
  if (!group.memberIds.includes(requesterId)) { res.status(403).json({ error: "Not a member" }); return; }

  // Fetch all feedback rows for this group
  const allFeedback = await db
    .select({ fromUserId: feedbackTable.fromUserId, connections: feedbackTable.connections })
    .from(feedbackTable)
    .where(eq(feedbackTable.groupId, groupId));

  type Connection = { userId: string; verdict: "connect" | "pass" };

  // Build a map: userId → set of userIds they chose "connect" for
  const connectsFrom = new Map<string, Set<string>>();
  for (const row of allFeedback) {
    const conns = (row.connections ?? []) as Connection[];
    const chosen = new Set(conns.filter((c) => c.verdict === "connect").map((c) => c.userId));
    connectsFrom.set(row.fromUserId, chosen);
  }

  // Find users who the requester chose connect AND who also chose connect back
  const requesterChoices = connectsFrom.get(requesterId) ?? new Set<string>();
  const mutualIds = group.memberIds.filter(
    (id) => id !== requesterId && requesterChoices.has(id) && (connectsFrom.get(id)?.has(requesterId) ?? false),
  );

  // Embed basic member info for the mutual connects
  const members = mutualIds.length > 0
    ? await db
        .select({ id: usersTable.id, nickname: usersTable.nickname, personalityTraits: usersTable.personalityTraits })
        .from(usersTable)
        .where(inArray(usersTable.id, mutualIds))
    : [];

  res.json({ mutualConnects: members, hasFeedback: connectsFrom.has(requesterId) });
});

// GET /api/groups/:id/feedback-pending
router.get("/:id/feedback-pending", requireAuth, async (req, res) => {
  const groupId = req.params["id"] as string;
  const userId = req.user!.id;

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId))
    .limit(1);

  if (!group || !group.memberIds.includes(userId)) {
    res.json({ pending: false });
    return;
  }

  const now = Date.now();
  const meetupInPast =
    group.meetupAt !== null && group.meetupAt !== undefined && group.meetupAt < now;

  if (!meetupInPast) {
    res.json({ pending: false });
    return;
  }

  const [existing] = await db
    .select({ id: feedbackTable.id })
    .from(feedbackTable)
    .where(
      and(
        eq(feedbackTable.groupId, groupId),
        eq(feedbackTable.fromUserId, userId),
      ),
    )
    .limit(1);

  res.json({ pending: !existing });
});

export default router;
