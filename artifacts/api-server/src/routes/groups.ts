import { eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import { db, groupsTable, usersTable } from "@workspace/db";
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

router.get("/:id", requireAuth, async (req, res) => {
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, req.params["id"]!))
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

export default router;
