import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, reportsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// A user is auto-flagged for admin review once they accumulate this many reports.
const AUTO_FLAG_THRESHOLD = 3;

const CreateReportBody = z.object({
  targetUserId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  reason: z.string().min(5).max(500),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid report data" });
    return;
  }

  if (parsed.data.targetUserId === req.user!.id) {
    res.status(400).json({ error: "Cannot report yourself" });
    return;
  }

  // Insert the report
  const [created] = await db
    .insert(reportsTable)
    .values({ ...parsed.data, reporterId: req.user!.id })
    .returning();

  // Count total reports against this user and auto-flag if threshold reached
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reportsTable)
    .where(eq(reportsTable.targetUserId, parsed.data.targetUserId));

  if (count >= AUTO_FLAG_THRESHOLD) {
    await db
      .update(usersTable)
      .set({ flagged: true })
      .where(eq(usersTable.id, parsed.data.targetUserId));
  }

  res.status(201).json(created);
});

export default router;
