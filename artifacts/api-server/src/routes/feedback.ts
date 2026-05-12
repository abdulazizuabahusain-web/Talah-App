import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, feedbackTable, groupsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { trackIfConsented } from "../lib/analytics";

const router = Router();

const ConnectionEntry = z.object({
  userId: z.string().uuid(),
  verdict: z.enum(["connect", "pass"]),
});

const CreateFeedbackBody = z.object({
  groupId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  wouldMeetAgain: z.enum(["yes", "maybe", "no"]).optional(),
  connections: z.array(ConnectionEntry).optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid feedback data" });
    return;
  }

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, parsed.data.groupId))
    .limit(1);

  if (!group || !group.memberIds.includes(req.user!.id)) {
    res.status(403).json({ error: "Not a member of this group" });
    return;
  }

  const existing = await db
    .select()
    .from(feedbackTable)
    .where(
      and(
        eq(feedbackTable.groupId, parsed.data.groupId),
        eq(feedbackTable.fromUserId, req.user!.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Feedback already submitted" });
    return;
  }

  const [created] = await db
    .insert(feedbackTable)
    .values({
      groupId: parsed.data.groupId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      wouldMeetAgain: parsed.data.wouldMeetAgain,
      connections: parsed.data.connections ?? null,
      fromUserId: req.user!.id,
    })
    .returning();

  trackIfConsented(req, "feedback_submitted", req.user!.id, {
    rating: parsed.data.rating,
    groupId: parsed.data.groupId,
  });

  res.status(201).json(created);
});

export default router;
