import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import { db, groupsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const rows = await db
    .select()
    .from(groupsTable)
    .where(sql`${groupsTable.memberIds} @> ARRAY[${userId}]::text[]`)
    .orderBy(groupsTable.createdAt);
  res.json(rows);
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

  res.json(group);
});

export default router;
