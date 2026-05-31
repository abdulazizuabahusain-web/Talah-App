import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, feedbackTable, groupsTable } from "@workspace/db";
import { track } from "../lib/analytics";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const ConnectionEntry = z.object({
  userId: z.string().uuid(),
  verdict: z.enum(["connect", "pass"]),
});

const CreateFeedbackBody = z.object({
  groupId: z.string().uuid(),
  comfortRating: z.number().int().min(1).max(5),
  groupFit: z.enum(["very_suitable", "somewhat", "not_suitable"]),
  wouldJoinAgain: z.enum(["yes", "maybe", "no"]),
  venueRating: z.number().int().min(1).max(5),
  venueSuitable: z.enum(["yes", "maybe", "no"]),
  safetyConcern: z.boolean(),
  safetyConcernDetails: z.string().max(1000).optional(),
  comment: z.string().max(500).optional(),
  connections: z.array(ConnectionEntry).optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid feedback data", details: parsed.error.issues });
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

  const [existing] = await db
    .select({ id: feedbackTable.id })
    .from(feedbackTable)
    .where(
      and(
        eq(feedbackTable.groupId, parsed.data.groupId),
        eq(feedbackTable.fromUserId, req.user!.id),
      ),
    )
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Feedback already submitted for this Tal'ah." });
    return;
  }

  const [created] = await db
    .insert(feedbackTable)
    .values({
      groupId: parsed.data.groupId,
      comfortRating: parsed.data.comfortRating,
      groupFit: parsed.data.groupFit,
      wouldJoinAgain: parsed.data.wouldJoinAgain,
      venueRating: parsed.data.venueRating,
      venueSuitable: parsed.data.venueSuitable,
      safetyConcern: parsed.data.safetyConcern,
      safetyConcernDetails: parsed.data.safetyConcernDetails ?? null,
      comment: parsed.data.comment ?? null,
      connections: parsed.data.connections ?? null,
      fromUserId: req.user!.id,
    })
    .returning();

  track("feedback_submitted", req.user!.id, {
    comfortRating: parsed.data.comfortRating,
    groupId: parsed.data.groupId,
    safetyConcern: parsed.data.safetyConcern,
  });
  res.status(201).json(created);
});

// GET /api/feedback/status?groupId=<uuid>
router.get("/status", requireAuth, async (req, res) => {
  const groupId = req.query["groupId"] as string | undefined;
  if (!groupId) {
    res.status(400).json({ error: "groupId required" });
    return;
  }

  const [existing] = await db
    .select({ id: feedbackTable.id, createdAt: feedbackTable.createdAt })
    .from(feedbackTable)
    .where(
      and(
        eq(feedbackTable.groupId, groupId),
        eq(feedbackTable.fromUserId, req.user!.id),
      ),
    )
    .limit(1);

  if (existing) {
    res.json({
      submitted: true,
      feedbackId: existing.id,
      submittedAt: existing.createdAt,
    });
  } else {
    res.json({ submitted: false });
  }
});

export default router;
