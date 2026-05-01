import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  db,
  feedbackTable,
  groupsTable,
  reportsTable,
  requestsTable,
  usersTable,
} from "@workspace/db";
import { createAdminToken, isAdminToken } from "../lib/adminSessions";
import { requireAdmin } from "../middlewares/requireAuth";

const router = Router();
const ADMIN_PIN = process.env["ADMIN_PIN"] ?? "1234";

// POST /api/admin/login  — PIN-based web dashboard login
router.post("/login", (req, res) => {
  const { pin } = req.body ?? {};
  if (pin !== ADMIN_PIN) {
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
router.get("/users", requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users);
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  const [updated] = await db
    .update(usersTable)
    .set(req.body)
    .where(eq(usersTable.id, req.params["id"]!))
    .returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.params["id"]!));
  res.json({ ok: true });
});

// ── Requests ─────────────────────────────────────────────────────────────────
router.get("/requests", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(requestsTable).orderBy(requestsTable.createdAt);
  res.json(rows);
});

router.patch("/requests/:id", requireAdmin, async (req, res) => {
  const [updated] = await db
    .update(requestsTable)
    .set(req.body)
    .where(eq(requestsTable.id, req.params["id"]!))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// ── Groups ───────────────────────────────────────────────────────────────────
router.get("/groups", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(groupsTable).orderBy(groupsTable.createdAt);
  res.json(rows);
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
  const [updated] = await db
    .update(groupsTable)
    .set(req.body)
    .where(eq(groupsTable.id, req.params["id"]!))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
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

  const label =
    overall >= 80 ? "excellent" : overall >= 65 ? "good" : overall >= 45 ? "moderate" : "weak";

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
