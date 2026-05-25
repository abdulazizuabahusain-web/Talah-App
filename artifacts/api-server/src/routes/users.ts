import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db, usersTable, sessionsTable, talahTypeChangeRequestsTable } from "@workspace/db";
import { track } from "../lib/analytics";
import { requireAuth } from "../middlewares/requireAuth";
import { sanitizeFields } from "../lib/sanitize";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

const PatchProfileBody = z.object({
  nickname: z.string().min(2).max(40).optional(),
  // gender is only respected during initial onboarding (onboarded === false).
  // After onboarding, gender changes require admin approval via /me/talah-type-change-request.
  gender: z.enum(["woman", "man"]).optional(),
  city: z.string().optional(),
  lifeStage: z.string().optional(),
  interests: z.array(z.string()).optional(),
  preferredMeetup: z.string().optional(),
  socialEnergy: z.string().optional(),
  conversationStyle: z.string().optional(),
  personalityTraits: z.array(z.string()).optional(),
  socialEnergyScore: z.number().int().optional(),
  conversationDepthScore: z.number().int().optional(),
  onboarded: z.boolean().optional(),
  expoPushToken: z.string().optional(),
  // @deprecated fields — still accepted so old clients don't break
  ageRange: z.string().optional(),
  lifestyle: z.string().optional(),
  personality: z.string().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  funFact: z.string().optional(),
  enjoyedTopics: z.array(z.string()).optional(),
  socialIntent: z.string().optional(),
  planningPreference: z.string().optional(),
  meetupAtmosphere: z.string().optional(),
  interactionPreference: z.string().optional(),
  opennessLevel: z.string().optional(),
  socialBoundary: z.string().optional(),
  planningScore: z.number().int().optional(),
  atmosphereScore: z.number().int().optional(),
  interactionScore: z.number().int().optional(),
  opennessScore: z.number().int().optional(),
  boundaryScore: z.number().int().optional(),
  // Contact info — private; only revealed to mutual connects
  contactPhone: z.string().max(30).nullable().optional(),
  instagram: z.string().max(60).nullable().optional(),
  snapchat: z.string().max(60).nullable().optional(),
  twitter: z.string().max(60).nullable().optional(),
  tiktok: z.string().max(60).nullable().optional(),
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = PatchProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile data", details: parsed.error.issues });
    return;
  }

  const sanitized = sanitizeFields(parsed.data) as Record<string, unknown>;

  // Safety enforcement: gender is a protected field post-onboarding.
  // Strip it silently so existing clients don't break with an error.
  if (req.user!.onboarded && "gender" in sanitized) {
    delete sanitized["gender"];
  }

  const [updated] = await db
    .update(usersTable)
    .set(sanitized)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  if (parsed.data.onboarded === true) {
    track("profile_completed", req.user!.id, {
      city: updated.city ?? undefined,
      hasPersonality: !!(updated.personality),
    });
  }
  res.json(updated);
});

router.delete("/me", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

// ── Tal'ah Type Change Request ─────────────────────────────────────────────

const TypeChangeRequestBody = z.object({
  requestedGender: z.enum(["woman", "man"]),
  reason: z.string().max(500).optional(),
});

// GET /api/users/me/talah-type-change-request
// Returns the most recent type change request for the current user (or null).
router.get("/me/talah-type-change-request", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(talahTypeChangeRequestsTable)
    .where(eq(talahTypeChangeRequestsTable.userId, req.user!.id))
    .orderBy(desc(talahTypeChangeRequestsTable.requestedAt))
    .limit(1);
  res.json(rows[0] ?? null);
});

// POST /api/users/me/talah-type-change-request
// Submit a Tal'ah Type change request. Only one pending request allowed at a time.
router.post("/me/talah-type-change-request", requireAuth, async (req, res) => {
  const user = req.user!;

  const parsed = TypeChangeRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (parsed.data.requestedGender === user.gender) {
    res.status(400).json({ error: "Requested Tal'ah Type must be different from current" });
    return;
  }

  if (!user.gender) {
    res.status(400).json({ error: "Current Tal'ah Type is not set" });
    return;
  }

  // Enforce one pending request at a time
  const existing = await db
    .select({ id: talahTypeChangeRequestsTable.id })
    .from(talahTypeChangeRequestsTable)
    .where(
      and(
        eq(talahTypeChangeRequestsTable.userId, user.id),
        eq(talahTypeChangeRequestsTable.status, "pending"),
      ),
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "You already have a pending Tal'ah Type change request" });
    return;
  }

  const [created] = await db
    .insert(talahTypeChangeRequestsTable)
    .values({
      userId: user.id,
      currentGender: user.gender,
      requestedGender: parsed.data.requestedGender,
      reason: parsed.data.reason ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json(created);
});

// POST /api/users/block/:targetId
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
router.get("/blocked", requireAuth, (req, res) => {
  res.json({ blockedUserIds: req.user!.blockedUserIds ?? [] });
});

export default router;
