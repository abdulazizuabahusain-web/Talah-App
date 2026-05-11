import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, surveysTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const SubmitSurveyBody = z.object({
  type: z.enum(["micro", "exit"]),
  responses: z.record(z.string(), z.string()),
});

// POST /api/surveys
router.post("/", requireAuth, async (req, res) => {
  const parsed = SubmitSurveyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid survey data", details: parsed.error.issues });
    return;
  }

  const [row] = await db
    .insert(surveysTable)
    .values({
      userId: req.user!.id,
      type: parsed.data.type,
      responses: parsed.data.responses,
    })
    .returning({ id: surveysTable.id });

  res.status(201).json({ id: row.id });
});

// GET /api/surveys/submitted?type=micro|exit
router.get("/submitted", requireAuth, async (req, res) => {
  const type = req.query["type"] as string | undefined;
  if (!type || !["micro", "exit"].includes(type)) {
    res.status(400).json({ error: "type query param required (micro|exit)" });
    return;
  }

  const [row] = await db
    .select({ id: surveysTable.id })
    .from(surveysTable)
    .where(
      and(
        eq(surveysTable.userId, req.user!.id),
        eq(surveysTable.type, type),
      ),
    )
    .limit(1);

  res.json({ submitted: !!row });
});

export default router;
