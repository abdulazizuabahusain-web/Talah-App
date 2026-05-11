import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, surveysTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const SurveyType = z.enum(["micro", "exit"]);

const CreateSurveyBody = z.object({
  type: SurveyType,
  responses: z.record(z.string().max(200)),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateSurveyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid survey data" });
    return;
  }

  const [created] = await db
    .insert(surveysTable)
    .values({
      userId: req.user!.id,
      type: parsed.data.type,
      responses: parsed.data.responses,
    })
    .returning({ id: surveysTable.id });

  res.status(201).json({ id: created.id });
});

router.get("/submitted", requireAuth, async (req, res) => {
  const parsed = z.object({ type: SurveyType }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid survey type" });
    return;
  }

  const existing = await db
    .select({ id: surveysTable.id })
    .from(surveysTable)
    .where(
      and(
        eq(surveysTable.userId, req.user!.id),
        eq(surveysTable.type, parsed.data.type),
      ),
    )
    .limit(1);

  res.json({ submitted: existing.length > 0 });
});

export default router;
