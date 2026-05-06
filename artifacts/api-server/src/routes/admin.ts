import bcrypt from "bcryptjs";
import { eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sanitizeFields } from "../lib/sanitize";
import {
  db,
  feedbackTable,
  groupsTable,
  reportsTable,
  requestsTable,
  usersTable,
} from "@workspace/db";
import { createAdminToken, isAdminToken } from "../lib/adminSessions";
import { sendPushToMany } from "../lib/push";
import { requireAdmin } from "../middlewares/requireAuth";

const router = Router();

// ADMIN_PIN_HASH: bcrypt hash of the admin PIN stored in env.
// Generate with: node -e "const b=require('bcryptjs');console.log(b.hashSync('YOUR_PIN',12))"
// Falls back to a hash of "1234" for development (never use in production).
const DEV_HASH = "$2a$12$K8GkNZOekIUPZMaSLSzfC.HlqYDzW2GJkqg2LIi5/kqAHFb7xOBUe"; // hash of "1234"
const ADMIN_PIN_HASH = process.env["ADMIN_PIN_HASH"] ?? DEV_HASH;

// Rate-limit admin login: max 5 attempts per 15 minutes per IP
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts — please wait 15 minutes" },
});

// POST /api/admin/login  — PIN-based web dashboard login
router.post("/login", adminLoginLimiter, async (req, res) => {
  const { pin } = req.body ?? {};
  if (!pin || typeof pin !== "string") {
    res.status(400).json({ error: "PIN required" });
    return;
  }
  const valid = await bcrypt.compare(pin, ADMIN_PIN_HASH);
  if (!valid) {
    res.status(401).json({ error: "Invalid PIN" });
    return;
  }
  const token = createAdminToken();
  res.json({ token });
});

// GET /api/admin/me — confirm token is valid admin session
router.get("/me", (req, res) => {
  const header = req.headers["authorization"];
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !isAdminToken(token)) {
    res.status(401).json({ error: "Not authenticated as admin" });
    return;
  }
  res.json({ ok: true });
});

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string) || 50, 200);
  const offset = parseInt(req.query["offset"] as string) || 0;
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(usersTable).orderBy(usersTable.createdAt).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
  ]);
  res.json({ data: rows, total: count, hasMore: offset + rows.length < count });
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  const [updated] = await db
    .update(usersTable)
    .set(req.body)
    .where(eq(usersTable.id, req.params["id"] as string))
    .returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.params["id"] as string));
  res.json({ ok: true });
});

// ── Requests ─────────────────────────────────────────────────────────────────
router.get("/requests", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string) || 50, 200);
  const offset = parseInt(req.query["offset"] as string) || 0;
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(requestsTable).orderBy(requestsTable.createdAt).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(requestsTable),
  ]);
  res.json({ data: rows, total: count, hasMore: offset + rows.length < count });
});

router.patch("/requests/:id", requireAdmin, async (req, res) => {
  const [updated] = await db
    .update(requestsTable)
    .set(req.body)
    .where(eq(requestsTable.id, req.params["id"] as string))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// ── Groups ───────────────────────────────────────────────────────────────────
router.get("/groups", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string) || 50, 200);
  const offset = parseInt(req.query["offset"] as string) || 0;
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(groupsTable).orderBy(groupsTable.createdAt).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(groupsTable),
  ]);
  res.json({ data: rows, total: count, hasMore: offset + rows.length < count });
});

const CreateGroupBody = z.object({
  meetupType: z.enum(["coffee", "dinner"]),
  gender: z.enum(["woman", "man"]),
  city: z.string(),
  area: z.string(),
  memberIds: z.array(z.string()),
  requestIds: z.array(z.string()).optional(),
  venue: z.string().optional(),
  meetupAt: z.number().optional(),
});

router.post("/groups", requireAdmin, async (req, res) => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid group data" }); return; }

  const [group] = await db
    .insert(groupsTable)
    .values({ ...parsed.data, status: "matched", requestIds: parsed.data.requestIds ?? [] })
    .returning();

  if (parsed.data.requestIds?.length) {
    for (const reqId of parsed.data.requestIds) {
      await db
        .update(requestsTable)
        .set({ status: "matched" })
        .where(eq(requestsTable.id, reqId));
    }
  }

  res.status(201).json(group);
});

router.patch("/groups/:id", requireAdmin, async (req, res) => {
  const groupId = req.params["id"] as string;
  const [before] = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);

  const sanitized = sanitizeFields(req.body as Record<string, unknown>);
  const [updated] = await db
    .update(groupsTable)
    .set(sanitized)
    .where(eq(groupsTable.id, groupId))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  // Fire push notifications asynchronously — never block the response
  void (async () => {
    if (!before || updated.memberIds.length === 0) return;
    const members = await db
      .select({ expoPushToken: usersTable.expoPushToken })
      .from(usersTable)
      .where(inArray(usersTable.id, updated.memberIds));
    const tokens = members.map((m) => m.expoPushToken);

    const statusChanged = before.status !== updated.status;
    const venueSet = !before.venue && updated.venue;
    const timeSet = !before.meetupAt && updated.meetupAt;

    if (statusChanged && updated.status === "revealed") {
      await sendPushToMany(tokens, "طلعتك جاهزة! 🎉", "تعرّفي على مجموعتك الآن — الكشف مفتوح");
    }
    if (statusChanged && updated.status === "matched") {
      await sendPushToMany(tokens, "تم ترتيب طلعتك ✨", "يتم التجهيز للكشف عن تفاصيل اللقاء قريباً");
    }
    if ((venueSet || timeSet) && updated.venue && updated.meetupAt) {
      const when = new Date(updated.meetupAt).toLocaleString("ar-SA", {
        weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit",
      });
      await sendPushToMany(tokens, "تم تحديد موعد ومكان طلعتك 📍", `${updated.venue} · ${when}`);
    }
  })();

  res.json(updated);
});

// ── Candidate Suggestions ─────────────────────────────────────────────────────
// GET /api/admin/requests/:id/candidates
// Returns the top matching candidates for a pending request, ranked by compatibility score.
// Mirrors findCandidatesFor() from the mobile matching engine.
router.get("/requests/:id/candidates", requireAdmin, async (req, res) => {
  const requestId = req.params["id"] as string;

  const [request] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ error: "Request is not pending" });
    return;
  }

  const [requester] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, request.userId));

  if (!requester) {
    res.status(404).json({ error: "Requester not found" });
    return;
  }

  // Load all pending requests (other than this one) and their users
  const allRequests = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.status, "pending"));

  const allUsers = await db.select().from(usersTable);

  // ── Matching logic (mirrors findCandidatesFor from matching.ts) ──
  const requesterBlocked = new Set(requester.blockedUserIds ?? []);

  interface Candidate {
    userId: string;
    nickname: string | null;
    city: string | null;
    ageRange: string | null;
    gender: string | null;
    preferredMeetup: string | null;
    socialEnergyScore: number | null;
    conversationDepthScore: number | null;
    socialIntent: string | null;
    score: number;
    requestId: string;
    preferredDate: string;
    preferredTime: string;
    area: string;
  }

  const candidates: Candidate[] = [];

  for (const r of allRequests) {
    if (r.id === requestId) continue;
    if (r.meetupType !== request.meetupType) continue;

    const u = allUsers.find((x) => x.id === r.userId);
    if (!u) continue;
    if (u.gender !== requester.gender) continue;
    if (u.city !== requester.city) continue;
    if (u.flagged) continue;
    if (requesterBlocked.has(u.id)) continue;
    if ((u.blockedUserIds ?? []).includes(requester.id)) continue;

    // Soft scoring — interests + topics + age + lifestyle + energy + conversation + intent
    const sharedInterests = (requester.interests ?? []).filter((i: string) =>
      (u.interests ?? []).includes(i)
    ).length;
    const sharedTopics = (requester.enjoyedTopics ?? []).filter((t: string) =>
      (u.enjoyedTopics ?? []).includes(t)
    ).length;

    const AGE_ORDER = ["18-24", "25-29", "30-34", "35-44", "45+"];
    const ageDist = Math.abs(
      AGE_ORDER.indexOf(requester.ageRange ?? "") - AGE_ORDER.indexOf(u.ageRange ?? "")
    );
    const ageScore = Math.max(0, 4 - ageDist) * 2;

    const lifestyleScore = requester.lifestyle === u.lifestyle ? 2 : 0;

    const energyDiff =
      requester.socialEnergyScore !== null && u.socialEnergyScore !== null
        ? Math.abs((requester.socialEnergyScore ?? 0) - (u.socialEnergyScore ?? 0))
        : 99;
    const energyScore = energyDiff <= 1 ? 2 : energyDiff <= 2 ? 1 : 0;

    const convDiff =
      requester.conversationDepthScore !== null && u.conversationDepthScore !== null
        ? Math.abs((requester.conversationDepthScore ?? 0) - (u.conversationDepthScore ?? 0))
        : 99;
    const convScore = convDiff <= 1 ? 2 : 0;

    const intentScore =
      requester.socialIntent && u.socialIntent && requester.socialIntent === u.socialIntent ? 2 : 0;

    const totalScore =
      sharedInterests * 3 + sharedTopics * 2 + ageScore + lifestyleScore + energyScore + convScore + intentScore;

    candidates.push({
      userId: u.id,
      nickname: u.nickname,
      city: u.city,
      ageRange: u.ageRange,
      gender: u.gender,
      preferredMeetup: u.preferredMeetup,
      socialEnergyScore: u.socialEnergyScore,
      conversationDepthScore: u.conversationDepthScore,
      socialIntent: u.socialIntent,
      score: totalScore,
      requestId: r.id,
      preferredDate: r.preferredDate,
      preferredTime: r.preferredTime,
      area: r.area,
    });
  }

  // Sort by score desc, return top 8
  candidates.sort((a, b) => b.score - a.score);
  res.json(candidates.slice(0, 8));
});

// ── Feedback ──────────────────────────────────────────────────────────────────
router.get("/feedback", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(feedbackTable).orderBy(feedbackTable.createdAt);
  res.json(rows);
});

// ── Reports ───────────────────────────────────────────────────────────────────
router.get("/reports", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(reportsTable).orderBy(reportsTable.createdAt);
  res.json(rows);
});

// ── Compatibility ─────────────────────────────────────────────────────────────
const CompatBody = z.object({
  userIds: z.array(z.string().uuid()).min(3).max(5),
});

router.post("/compatibility", requireAdmin, async (req, res) => {
  const parsed = CompatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide 3–5 user IDs" });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(sql`${usersTable.id} = ANY(${parsed.data.userIds})`);

  if (users.length < 3) {
    res.status(400).json({ error: "Not enough users found" });
    return;
  }

  const report = computeGroupCompatibility(users);
  res.json(report);
});

// ── Inline compatibility logic (server-side) ──────────────────────────────────
type AnyUser = typeof usersTable.$inferSelect;

function computeGroupCompatibility(users: AnyUser[]) {
  const genders = [...new Set(users.map((u) => u.gender))];
  const cities = [...new Set(users.map((u) => u.city))];
  const genderOk = genders.length === 1;
  const cityOk = cities.length === 1;

  const allDays = users.map((u) => new Set(u.preferredDays));
  const commonDays = [...allDays[0]!].filter((d) => allDays.every((s) => s.has(d)));
  const allTimes = users.map((u) => new Set(u.preferredTimes));
  const commonTimes = [...allTimes[0]!].filter((t) => allTimes.every((s) => s.has(t)));
  const availabilityOk = commonDays.length > 0 && commonTimes.length > 0;

  const hardScore = [genderOk, cityOk, availabilityOk].filter(Boolean).length / 3;
  const warnings: string[] = [];
  if (!genderOk) warnings.push("Mixed genders — not allowed");
  if (!cityOk) warnings.push(`Different cities: ${cities.join(", ")}`);
  if (!availabilityOk) warnings.push("No overlapping availability");

  const allInterests = users.flatMap((u) => u.interests);
  const interestCounts: Record<string, number> = {};
  for (const i of allInterests) interestCounts[i] = (interestCounts[i] ?? 0) + 1;
  const sharedInterests = Object.entries(interestCounts)
    .filter(([, c]) => c >= Math.ceil(users.length / 2))
    .map(([k]) => k);
  const interestOverlapPct = Math.round((sharedInterests.length / Math.max(1, Object.keys(interestCounts).length)) * 100);
  const interestScore = interestOverlapPct / 100;

  const lifestyles = [...new Set(users.map((u) => u.lifestyle))];
  const lifestyleAligned = lifestyles.length <= 2;
  const lifestyleNote = lifestyleAligned ? `Lifestyles compatible: ${lifestyles.join(", ")}` : `Too many lifestyle types: ${lifestyles.join(", ")}`;
  const lifestyleScore = lifestyleAligned ? 1 : 0.4;

  const energyScores = users.map((u) => u.socialEnergyScore ?? 0);
  const avgEnergyScore = energyScores.reduce((a, b) => a + b, 0) / users.length;
  const energyVariance = energyScores.reduce((a, b) => a + Math.abs(b - avgEnergyScore), 0) / users.length;
  const energyBalance = energyVariance <= 1 ? "balanced" : energyVariance <= 2 ? "moderate" : "divergent";
  const energyNote = `Energy variance: ${energyVariance.toFixed(1)} (${energyBalance})`;
  const energyScore = energyBalance === "balanced" ? 1 : energyBalance === "moderate" ? 0.6 : 0.3;

  const convStyles = [...new Set(users.map((u) => u.conversationStyle))];
  const convCompatible = convStyles.length <= 2;
  const convNote = convCompatible ? `Conversation styles align: ${convStyles.join(", ")}` : `Mismatched styles: ${convStyles.join(", ")}`;
  const convScore = convCompatible ? 1 : 0.4;

  const intents = [...new Set(users.map((u) => u.socialIntent))];
  const intentNote = intents.length <= 2 ? `Aligned intent: ${intents.join(", ")}` : `Mixed intent: ${intents.join(", ")}`;
  const boundaries = [...new Set(users.map((u) => u.socialBoundary))];
  const hasMismatch = boundaries.includes("very_relaxed") && boundaries.includes("more_reserved");
  const boundaryNote = hasMismatch ? `Caution: very different boundary levels` : `Boundaries compatible`;
  const intentScore = (intents.length <= 2 ? 0.6 : 0.3) + (hasMismatch ? 0 : 0.4);

  const overall = Math.round(
    hardScore * 25 +
    interestScore * 25 +
    lifestyleScore * 15 +
    energyScore * 15 +
    convScore * 10 +
    intentScore * 10,
  );

  // Thresholds aligned to blueprint spec (and matching.ts client-side):
  // Excellent ≥85 · Good ≥70 · Moderate ≥55 · Weak <55
  const label =
    overall >= 85 ? "excellent" : overall >= 70 ? "good" : overall >= 55 ? "moderate" : "weak";

  return {
    overallScore: overall,
    label,
    warnings,
    genderOk,
    cityOk,
    availabilityOk,
    commonDays,
    commonTimes,
    sharedInterests,
    interestOverlapPct,
    lifestyleAligned,
    lifestyleNote,
    avgEnergyScore,
    energyBalance,
    energyNote,
    convCompatible,
    convNote,
    intentNote,
    boundaryNote,
  };
}

export default router;
