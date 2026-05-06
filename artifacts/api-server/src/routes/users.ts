import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sanitizeFields } from "../lib/sanitize";

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
  expoPushToken: z.string().optional(),
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = PatchProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile data", details: parsed.error.issues });
    return;
  }

  const sanitized = sanitizeFields(parsed.data);
  const [updated] = await db
    .update(usersTable)
    .set(sanitized)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  res.json(updated);
});

router.delete("/me", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

// POST /api/users/block/:targetId
// Adds targetId to the caller's blockedUserIds list. Idempotent — safe to call multiple times.
// Blocked users are excluded from future group matching on both sides.
router.post("/block/:targetId", requireAuth, async (req, res) => {
  const targetId = req.params["targetId"] as string;
  if (!targetId) {
    res.status(400).json({ error: "Missing targetId" });
    return;
  }
  if (targetId === req.user!.id) {
    res.status(400).json({ error: "Cannot block yourself" });
    return;
  }

  const currentUser = req.user!;
  const alreadyBlocked = (currentUser.blockedUserIds ?? []).includes(targetId);
  if (alreadyBlocked) {
    res.json({ ok: true, message: "Already blocked" });
    return;
  }

  const updatedBlocked = [...(currentUser.blockedUserIds ?? []), targetId];
  const [updated] = await db
    .update(usersTable)
    .set({ blockedUserIds: updatedBlocked })
    .where(eq(usersTable.id, currentUser.id))
    .returning();

  res.json({ ok: true, blockedUserIds: updated.blockedUserIds });
});

// GET /api/users/blocked
// Returns the caller's list of blocked user IDs.
router.get("/blocked", requireAuth, (req, res) => {
  res.json({ blockedUserIds: req.user!.blockedUserIds ?? [] });
});

export default router;
