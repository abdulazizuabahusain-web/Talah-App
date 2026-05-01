import { Router } from "express";
import { z } from "zod";
import { db, reportsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const CreateReportBody = z.object({
  targetUserId: z.string().uuid(),
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

  const [created] = await db
    .insert(reportsTable)
    .values({ ...parsed.data, reporterId: req.user!.id })
    .returning();

  res.status(201).json(created);
});

export default router;
