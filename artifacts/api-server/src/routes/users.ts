import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

const PatchProfileBody = z.object({
  nickname: z.string().min(2).max(40).optional(),
  gender: z.enum(["woman", "man"]).optional(),
  city: z.string().optional(),
  ageRange: z.string().optional(),
  lifestyle: z.string().optional(),
  interests: z.array(z.string()).optional(),
  personality: z.string().optional(),
  preferredMeetup: z.string().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  funFact: z.string().optional(),
  socialEnergy: z.string().optional(),
  conversationStyle: z.string().optional(),
  enjoyedTopics: z.array(z.string()).optional(),
  socialIntent: z.string().optional(),
  planningPreference: z.string().optional(),
  meetupAtmosphere: z.string().optional(),
  interactionPreference: z.string().optional(),
  personalityTraits: z.array(z.string()).optional(),
  opennessLevel: z.string().optional(),
  socialBoundary: z.string().optional(),
  socialEnergyScore: z.number().int().optional(),
  conversationDepthScore: z.number().int().optional(),
  planningScore: z.number().int().optional(),
  atmosphereScore: z.number().int().optional(),
  interactionScore: z.number().int().optional(),
  opennessScore: z.number().int().optional(),
  boundaryScore: z.number().int().optional(),
  onboarded: z.boolean().optional(),
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = PatchProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile data", details: parsed.error.issues });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  res.json(updated);
});

export default router;
