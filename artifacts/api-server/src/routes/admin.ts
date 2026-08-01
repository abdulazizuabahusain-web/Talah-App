import bcrypt from "bcryptjs";
import { execSync } from "child_process";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { writeAdminAuditLog } from "../lib/audit";
import { logger } from "../lib/logger";
import { sanitizeFields } from "../lib/sanitize";
import {
  db,
  feedbackTable,
  groupsTable,
  reportsTable,
  requestsTable,
  usersTable,
  adminAuditLogsTable,
  surveysTable,
  talahTypeChangeRequestsTable,
  venuesTable,
  waitlistSignupsTable,
} from "@workspace/db";
import { createAdminToken, isAdminToken } from "../lib/adminSessions";
import { sendPushToMany } from "../lib/push";
import { requireAdmin } from "../middlewares/requireAuth";

const router = Router();

// ADMIN_PIN_HASH: bcrypt hash of the admin PIN stored in env.
// Generate with: node -e "const b=require('bcryptjs');console.log(b.hashSync('YOUR_PIN',12))"
// In production ADMIN_PIN_HASH must be set. In dev it falls back to bcrypt.hashSync("1234", 10)
// computed at startup — no pre-computed hash is stored in source.
function getAdminPinHash(): string {
  const hash = process.env["ADMIN_PIN_HASH"];
  if (hash) return hash;

  if (process.env["NODE_ENV"] === "production") {
    throw new Error("ADMIN_PIN_HASH must be set in production.");
  }

  return bcrypt.hashSync("1234", 10);
}

const ADMIN_PIN_HASH = getAdminPinHash();

// Rate-limit admin login: max 5 attempts per 15 minutes per IP
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts — please wait 15 minutes" },
});

const nullableString = z.string().nullable().optional();
const stringArray = z.array(z.string()).optional();

const AdminPatchUserBody = z
  .object({
    nickname: nullableString,
    email: z.string().email().nullable().optional(),
    gender: z.enum(["woman", "man"]).nullable().optional(),
    city: nullableString,
    ageRange: nullableString,
    lifestyle: nullableString,
    interests: stringArray,
    personality: nullableString,
    preferredMeetup: nullableString,
    preferredDays: stringArray,
    preferredTimes: stringArray,
    funFact: nullableString,
    socialEnergy: nullableString,
    conversationStyle: nullableString,
    enjoyedTopics: stringArray,
    socialIntent: nullableString,
    planningPreference: nullableString,
    meetupAtmosphere: nullableString,
    interactionPreference: nullableString,
    personalityTraits: stringArray,
    opennessLevel: nullableString,
    socialBoundary: nullableString,
    socialEnergyScore: z.number().int().nullable().optional(),
    conversationDepthScore: z.number().int().nullable().optional(),
    planningScore: z.number().int().nullable().optional(),
    atmosphereScore: z.number().int().nullable().optional(),
    interactionScore: z.number().int().nullable().optional(),
    opennessScore: z.number().int().nullable().optional(),
    boundaryScore: z.number().int().nullable().optional(),
    blockedUserIds: stringArray,
    expoPushToken: nullableString,
    onboarded: z.boolean().optional(),
    verified: z.boolean().optional(),
    flagged: z.boolean().optional(),
    isAdmin: z.boolean().optional(),
  })
  .strict();

const AdminPatchRequestBody = z
  .object({
    meetupType: z.enum(["coffee", "dinner"]).optional(),
    preferredDate: z.string().min(1).optional(),
    preferredTime: z.enum(["morning", "afternoon", "evening"]).optional(),
    area: z.string().min(1).optional(),
    status: z.enum(["pending", "matched", "cancelled"]).optional(),
  })
  .strict();

const AdminPatchGroupBody = z
  .object({
    status: z
      .enum(["pending", "matched", "revealed", "completed", "cancelled"])
      .optional(),
    meetupType: z.enum(["coffee", "dinner"]).optional(),
    gender: z.enum(["woman", "man"]).optional(),
    city: z.string().min(1).optional(),
    area: z.string().min(1).optional(),
    venue: z.string().nullable().optional(),
    googleMapsUrl: z.string().nullable().optional(),
    meetupAt: z.number().nullable().optional(),
    memberIds: z.array(z.string().uuid()).optional(),
    requestIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

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
    db
      .select()
      .from(usersTable)
      .orderBy(usersTable.createdAt)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
  ]);
  res.json({ data: rows, total: count, hasMore: offset + rows.length < count });
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  const parsed = AdminPatchUserBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid user update", details: parsed.error.issues });
    return;
  }

  const [before] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.params["id"] as string))
    .limit(1);

  const sanitized = sanitizeFields(parsed.data);
  const [updated] = await db
    .update(usersTable)
    .set(sanitized)
    .where(eq(usersTable.id, req.params["id"] as string))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await writeAdminAuditLog(req, {
    action: "user.update",
    targetTable: "users",
    targetId: updated.id,
    before,
    after: updated,
  });
  res.json(updated);
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  const userId = req.params["id"] as string;
  const [before] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  await writeAdminAuditLog(req, {
    action: "user.delete",
    targetTable: "users",
    targetId: userId,
    before,
  });
  res.json({ ok: true });
});

// ── Requests ─────────────────────────────────────────────────────────────────
router.get("/requests", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string) || 50, 200);
  const offset = parseInt(req.query["offset"] as string) || 0;
  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(requestsTable)
      .orderBy(requestsTable.createdAt)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(requestsTable),
  ]);
  res.json({ data: rows, total: count, hasMore: offset + rows.length < count });
});

router.patch("/requests/:id", requireAdmin, async (req, res) => {
  const parsed = AdminPatchRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid request update", details: parsed.error.issues });
    return;
  }

  const [before] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, req.params["id"] as string))
    .limit(1);

  const sanitized = sanitizeFields(parsed.data);
  const [updated] = await db
    .update(requestsTable)
    .set(sanitized)
    .where(eq(requestsTable.id, req.params["id"] as string))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAdminAuditLog(req, {
    action: "request.update",
    targetTable: "requests",
    targetId: updated.id,
    before,
    after: updated,
  });
  res.json(updated);
});

// ── Groups ───────────────────────────────────────────────────────────────────
router.get("/groups", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string) || 50, 200);
  const offset = parseInt(req.query["offset"] as string) || 0;
  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(groupsTable)
      .orderBy(groupsTable.createdAt)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(groupsTable),
  ]);
  res.json({ data: rows, total: count, hasMore: offset + rows.length < count });
});

const CreateGroupBody = z
  .object({
    meetupType: z.enum(["coffee", "dinner"]),
    gender: z.enum(["woman", "man"]),
    city: z.string().min(1),
    area: z.string().min(1),
    memberIds: z.array(z.string().uuid()),
    requestIds: z.array(z.string().uuid()).optional(),
    venue: z.string().optional(),
    meetupAt: z.number().optional(),
  })
  .strict();

router.post("/groups", requireAdmin, async (req, res) => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid group data" });
    return;
  }

  const [group] = await db
    .insert(groupsTable)
    .values({
      ...sanitizeFields(parsed.data),
      status: "matched",
      requestIds: parsed.data.requestIds ?? [],
    })
    .returning();

  await writeAdminAuditLog(req, {
    action: "group.create",
    targetTable: "groups",
    targetId: group.id,
    after: group,
  });

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
  const [before] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId))
    .limit(1);

  const parsed = AdminPatchGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid group update", details: parsed.error.issues });
    return;
  }

  const sanitized = sanitizeFields(parsed.data);
  const [updated] = await db
    .update(groupsTable)
    .set(sanitized)
    .where(eq(groupsTable.id, groupId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAdminAuditLog(req, {
    action: "group.update",
    targetTable: "groups",
    targetId: updated.id,
    before,
    after: updated,
  });

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
      await sendPushToMany(
        tokens,
        "طلعتك جاهزة! 🎉",
        "تعرّفي على مجموعتك الآن — الكشف مفتوح",
      );
    }
    if (statusChanged && updated.status === "matched") {
      await sendPushToMany(
        tokens,
        "تم ترتيب طلعتك ✨",
        "يتم التجهيز للكشف عن تفاصيل اللقاء قريباً",
      );
    }
    if ((venueSet || timeSet) && updated.venue && updated.meetupAt) {
      const when = new Date(updated.meetupAt).toLocaleString("ar-SA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit",
      });
      await sendPushToMany(
        tokens,
        "تم تحديد موعد ومكان طلعتك 📍",
        `${updated.venue} · ${when}`,
      );
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
      (u.interests ?? []).includes(i),
    ).length;
    const sharedTopics = (requester.enjoyedTopics ?? []).filter((t: string) =>
      (u.enjoyedTopics ?? []).includes(t),
    ).length;

    const AGE_ORDER = ["18-24", "25-29", "30-34", "35-44", "45+"];
    const ageDist = Math.abs(
      AGE_ORDER.indexOf(requester.ageRange ?? "") -
        AGE_ORDER.indexOf(u.ageRange ?? ""),
    );
    const ageScore = Math.max(0, 4 - ageDist) * 2;

    const lifestyleScore = requester.lifestyle === u.lifestyle ? 2 : 0;

    const energyDiff =
      requester.socialEnergyScore !== null && u.socialEnergyScore !== null
        ? Math.abs(
            (requester.socialEnergyScore ?? 0) - (u.socialEnergyScore ?? 0),
          )
        : 99;
    const energyScore = energyDiff <= 1 ? 2 : energyDiff <= 2 ? 1 : 0;

    const convDiff =
      requester.conversationDepthScore !== null &&
      u.conversationDepthScore !== null
        ? Math.abs(
            (requester.conversationDepthScore ?? 0) -
              (u.conversationDepthScore ?? 0),
          )
        : 99;
    const convScore = convDiff <= 1 ? 2 : 0;

    const intentScore =
      requester.socialIntent &&
      u.socialIntent &&
      requester.socialIntent === u.socialIntent
        ? 2
        : 0;

    const totalScore =
      sharedInterests * 3 +
      sharedTopics * 2 +
      ageScore +
      lifestyleScore +
      energyScore +
      convScore +
      intentScore;

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
  const rows = await db
    .select({
      id: feedbackTable.id,
      groupId: feedbackTable.groupId,
      fromUserId: feedbackTable.fromUserId,
      comfortRating: feedbackTable.comfortRating,
      groupFit: feedbackTable.groupFit,
      wouldJoinAgain: feedbackTable.wouldJoinAgain,
      venueRating: feedbackTable.venueRating,
      venueSuitable: feedbackTable.venueSuitable,
      safetyConcern: feedbackTable.safetyConcern,
      safetyConcernDetails: feedbackTable.safetyConcernDetails,
      comment: feedbackTable.comment,
      connections: feedbackTable.connections,
      createdAt: feedbackTable.createdAt,
      userNickname: usersTable.nickname,
      userGender: usersTable.gender,
      userCity: usersTable.city,
      groupCity: groupsTable.city,
      groupArea: groupsTable.area,
      groupMeetupType: groupsTable.meetupType,
      groupVenue: groupsTable.venue,
      groupMeetupAt: groupsTable.meetupAt,
    })
    .from(feedbackTable)
    .leftJoin(usersTable, eq(feedbackTable.fromUserId, usersTable.id))
    .leftJoin(groupsTable, eq(feedbackTable.groupId, groupsTable.id))
    .orderBy(desc(feedbackTable.createdAt));
  res.json(rows);
});

// GET /api/admin/groups/:groupId/feedback
router.get("/groups/:groupId/feedback", requireAdmin, async (req, res) => {
  const groupId = req.params["groupId"] as string;
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId))
    .limit(1);
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const rows = await db
    .select({
      id: feedbackTable.id,
      fromUserId: feedbackTable.fromUserId,
      comfortRating: feedbackTable.comfortRating,
      groupFit: feedbackTable.groupFit,
      wouldJoinAgain: feedbackTable.wouldJoinAgain,
      venueRating: feedbackTable.venueRating,
      venueSuitable: feedbackTable.venueSuitable,
      safetyConcern: feedbackTable.safetyConcern,
      safetyConcernDetails: feedbackTable.safetyConcernDetails,
      comment: feedbackTable.comment,
      createdAt: feedbackTable.createdAt,
      userNickname: usersTable.nickname,
      userGender: usersTable.gender,
    })
    .from(feedbackTable)
    .leftJoin(usersTable, eq(feedbackTable.fromUserId, usersTable.id))
    .where(eq(feedbackTable.groupId, groupId))
    .orderBy(feedbackTable.createdAt);

  const count = rows.length;
  const comfortRatings = rows.map((r) => r.comfortRating);
  const venueRatings = rows.map((r) => r.venueRating).filter((v): v is number => v !== null);
  const avgComfortRating = count > 0 ? comfortRatings.reduce((s, v) => s + v, 0) / count : null;
  const avgVenueRating =
    venueRatings.length > 0
      ? venueRatings.reduce((s, v) => s + v, 0) / venueRatings.length
      : null;

  res.json({
    group,
    feedback: rows,
    stats: {
      count,
      avgComfortRating,
      avgVenueRating,
      safetyConcernCount: rows.filter((r) => r.safetyConcern).length,
      wouldJoinAgainCounts: {
        yes: rows.filter((r) => r.wouldJoinAgain === "yes").length,
        maybe: rows.filter((r) => r.wouldJoinAgain === "maybe").length,
        no: rows.filter((r) => r.wouldJoinAgain === "no").length,
      },
    },
  });
});

// ── Reports ───────────────────────────────────────────────────────────────────
router.get("/reports", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(reportsTable)
    .orderBy(desc(reportsTable.createdAt));
  res.json(rows);
});

router.patch("/reports/:id", requireAdmin, async (req, res) => {
  const id = req.params["id"] as string;
  const { status } = req.body ?? {};
  const allowed = ["open", "reviewed", "dismissed", "actioned"];
  if (!status || !allowed.includes(status as string)) {
    res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
    return;
  }
  const [before] = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
  if (!before) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db
    .update(reportsTable)
    .set({ status: status as string })
    .where(eq(reportsTable.id, id))
    .returning();
  await writeAdminAuditLog(req, { action: "report.update_status", targetTable: "reports", targetId: id, before, after: updated });
  res.json(updated);
});

// ── Venues (admin CRUD) ────────────────────────────────────────────────────────

const VenueBody = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  area: z.string().optional(),
  type: z.enum(["coffee", "dinner", "both"]).default("both"),
  googleMapsUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

router.get("/venues", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(venuesTable).orderBy(venuesTable.city, venuesTable.name);
  res.json(rows);
});

router.post("/venues", requireAdmin, async (req, res) => {
  const parsed = VenueBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid venue data", details: parsed.error.issues }); return; }
  const [created] = await db.insert(venuesTable).values(parsed.data).returning();
  await writeAdminAuditLog(req, { action: "venue.create", targetTable: "venues", targetId: created.id, before: null, after: created });
  res.status(201).json(created);
});

router.patch("/venues/:id", requireAdmin, async (req, res) => {
  const id = req.params["id"] as string;
  const [before] = await db.select().from(venuesTable).where(eq(venuesTable.id, id)).limit(1);
  if (!before) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = VenueBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid venue data", details: parsed.error.issues }); return; }
  const [updated] = await db
    .update(venuesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(venuesTable.id, id))
    .returning();
  await writeAdminAuditLog(req, { action: "venue.update", targetTable: "venues", targetId: id, before, after: updated });
  res.json(updated);
});

router.delete("/venues/:id", requireAdmin, async (req, res) => {
  const id = req.params["id"] as string;
  const [before] = await db.select().from(venuesTable).where(eq(venuesTable.id, id)).limit(1);
  if (!before) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(venuesTable).set({ active: false, updatedAt: new Date() }).where(eq(venuesTable.id, id));
  await writeAdminAuditLog(req, { action: "venue.deactivate", targetTable: "venues", targetId: id, before, after: { ...before, active: false } });
  res.json({ ok: true });
});

// ── GitHub Sync Status ────────────────────────────────────────────────────────
const GITHUB_REPO = "abdulazizuabahusain-web/Talah-App";

// PAT expiry date: read from env (YYYY-MM-DD ISO date string).
// If the env var is missing the server falls back to a dev-only placeholder and logs a warning at startup (see index.ts).
const PAT_EXPIRES_AT_RAW = process.env["PAT_EXPIRES_AT"] ?? "1970-01-01";

// Validate format and parse using explicit UTC arithmetic to avoid timezone edge cases.
// The PAT is considered valid until the end of its expiry day (UTC midnight of the next day).
function computePatDaysLeft(): { patExpiresAt: string; patDaysLeft: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(PAT_EXPIRES_AT_RAW);
  if (!match) {
    logger.warn(
      { PAT_EXPIRES_AT_RAW },
      "PAT_EXPIRES_AT env var is malformed — expected YYYY-MM-DD",
    );
    return { patExpiresAt: PAT_EXPIRES_AT_RAW, patDaysLeft: 0 };
  }
  const [, y, m, d] = match;
  // End of expiry day in UTC
  const expiryMs = Date.UTC(Number(y), Number(m) - 1, Number(d) + 1);
  const nowMs = Date.now();
  const patDaysLeft = Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24));
  return { patExpiresAt: PAT_EXPIRES_AT_RAW, patDaysLeft };
}

router.get("/sync-status", requireAdmin, async (req, res) => {
  const pat = process.env["GITHUB_PAT"];
  const patInfo = computePatDaysLeft();

  if (!pat) {
    res.json({
      ok: false,
      error: "GITHUB_PAT secret is not configured",
      ...patInfo,
    });
    return;
  }

  let localSha = "unknown";
  try {
    localSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    req.log.warn("Could not read local git HEAD");
  }

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits/main`,
      {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Talah-Admin/1.0",
        },
      },
    );

    if (!ghRes.ok) {
      const status = ghRes.status;
      res.json({
        ok: false,
        error:
          status === 401
            ? "GitHub PAT is invalid or expired"
            : `GitHub API returned HTTP ${status}`,
        localSha,
        ...patInfo,
      });
      return;
    }

    const data = (await ghRes.json()) as {
      sha: string;
      commit: { message: string; committer: { date: string } };
    };

    const githubSha = data.sha;
    const shortSha = githubSha.slice(0, 7);
    const committedAt = data.commit.committer.date;
    const message = data.commit.message.split("\n")[0] ?? "";
    const upToDate = localSha !== "unknown" && localSha === githubSha;

    res.json({
      ok: true,
      githubSha,
      shortSha,
      committedAt,
      message,
      upToDate,
      localSha,
      ...patInfo,
    });
  } catch (err) {
    req.log.error({ err }, "GitHub sync-status fetch failed");
    res.json({
      ok: false,
      error: "Could not reach GitHub API",
      localSha,
      ...patInfo,
    });
  }
});

// ── Admin Audit Logs ──────────────────────────────────────────────────────────
router.get("/audit-logs", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query["limit"] as string) || 50, 200);
  const offset = parseInt(req.query["offset"] as string) || 0;
  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(adminAuditLogsTable)
      .orderBy(adminAuditLogsTable.createdAt)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(adminAuditLogsTable),
  ]);
  res.json({ data: rows, total: count, hasMore: offset + rows.length < count });
});

// ── Surveys ───────────────────────────────────────────────────────────────────
router.get("/surveys", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: surveysTable.id,
      userId: surveysTable.userId,
      type: surveysTable.type,
      responses: surveysTable.responses,
      createdAt: surveysTable.createdAt,
      nickname: usersTable.nickname,
      city: usersTable.city,
    })
    .from(surveysTable)
    .leftJoin(usersTable, eq(surveysTable.userId, usersTable.id))
    .orderBy(sql`${surveysTable.createdAt} DESC`);
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
    .where(inArray(usersTable.id, parsed.data.userIds));

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

  const hardScore = ((genderOk ? 0.5 : 0) + (cityOk ? 0.5 : 0)) * 30;
  const warnings: string[] = [];
  if (!genderOk) warnings.push("Mixed genders — not allowed");
  if (!cityOk) warnings.push(`Different cities: ${cities.join(", ")}`);

  const allInterests = users.flatMap((u) => u.interests);
  const interestCounts: Record<string, number> = {};
  for (const i of allInterests)
    interestCounts[i] = (interestCounts[i] ?? 0) + 1;
  const sharedInterests = Object.entries(interestCounts)
    .filter(([, c]) => c >= Math.ceil(users.length / 2))
    .map(([k]) => k);
  const interestOverlapPct = Math.round(
    (sharedInterests.length / Math.max(1, Object.keys(interestCounts).length)) * 100,
  );
  const interestScore = (interestOverlapPct / 100) * 20;

  // Meetup type alignment (15%)
  const meetupTypes = new Set(users.map((u) => u.preferredMeetup));
  const meetupAligned = meetupTypes.size === 1;
  const meetupScore = (meetupAligned ? 1 : 0.5) * 15;

  // Social energy (15%)
  const energyScores = users.map((u) => u.socialEnergyScore ?? 0);
  const avgEnergyScore = energyScores.reduce((a, b) => a + b, 0) / users.length;
  const energyVariance =
    energyScores.reduce((a, b) => a + Math.abs(b - avgEnergyScore), 0) / users.length;
  const energyBalance = energyVariance <= 1 ? "balanced" : energyVariance <= 2 ? "moderate" : "divergent";
  const energyNote = `Energy variance: ${energyVariance.toFixed(1)} (${energyBalance})`;
  const energyScore = (energyBalance === "balanced" ? 1 : energyBalance === "moderate" ? 0.6 : 0.3) * 15;

  // Conversation style (10%)
  const convStyles = [...new Set(users.map((u) => u.conversationStyle))];
  const convCompatible = convStyles.length <= 2;
  const convNote = convCompatible
    ? `Conversation styles align: ${convStyles.join(", ")}`
    : `Mismatched styles: ${convStyles.join(", ")}`;
  const convScore = (convCompatible ? 1 : 0.4) * 10;

  // Life stage (5%)
  const lifeStages = [...new Set(users.map((u) => u.lifeStage).filter(Boolean))];
  const lifeStageAligned = lifeStages.length <= 2;
  const lifeStageScore = (lifeStageAligned ? 1 : 0.5) * 5;

  // Personality traits (5%)
  const allTraits = users.flatMap((u) => u.personalityTraits ?? []);
  const traitCounts: Record<string, number> = {};
  for (const t of allTraits) traitCounts[t] = (traitCounts[t] ?? 0) + 1;
  const sharedTraits = Object.entries(traitCounts).filter(([, c]) => c >= 2).map(([k]) => k);
  const traitScore = (sharedTraits.length > 0 ? 1 : 0.5) * 5;

  const overall = Math.round(
    hardScore + interestScore + meetupScore + energyScore + convScore + lifeStageScore + traitScore,
  );

  const label =
    overall >= 85 ? "excellent" : overall >= 70 ? "good" : overall >= 55 ? "moderate" : "weak";

  return {
    overallScore: overall,
    label,
    warnings,
    genderOk,
    cityOk,
    availabilityOk: true,
    commonDays: [],
    commonTimes: [],
    sharedInterests,
    interestOverlapPct,
    lifestyleAligned: true,
    lifestyleNote: "",
    avgEnergyScore,
    energyBalance,
    energyNote,
    convCompatible,
    convNote,
    intentNote: "",
    boundaryNote: "",
  };
}

// ── Tal'ah Type Change Requests ───────────────────────────────────────────────

// GET /api/admin/talah-type-change-requests
router.get("/talah-type-change-requests", requireAdmin, async (req, res) => {
  const requests = await db
    .select()
    .from(talahTypeChangeRequestsTable)
    .orderBy(desc(talahTypeChangeRequestsTable.requestedAt));

  if (requests.length === 0) {
    res.json([]);
    return;
  }

  const userIds = [...new Set(requests.map((r) => r.userId))];
  const usersData = await db
    .select({ id: usersTable.id, nickname: usersTable.nickname })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  const nicknameMap = Object.fromEntries(usersData.map((u) => [u.id, u.nickname]));
  res.json(requests.map((r) => ({ ...r, nickname: nicknameMap[r.userId] ?? null })));
});

// POST /api/admin/talah-type-change-requests/:id/approve
router.post("/talah-type-change-requests/:id/approve", requireAdmin, async (req, res) => {
  const id = req.params["id"] as string;
  const { adminNotes } = (req.body ?? {}) as { adminNotes?: string };

  const [changeReq] = await db
    .select()
    .from(talahTypeChangeRequestsTable)
    .where(eq(talahTypeChangeRequestsTable.id, id));

  if (!changeReq) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (changeReq.status !== "pending") {
    res.status(400).json({ error: "Request is not pending" });
    return;
  }

  const [userBefore] = await db
    .select({ gender: usersTable.gender })
    .from(usersTable)
    .where(eq(usersTable.id, changeReq.userId));

  await db
    .update(usersTable)
    .set({ gender: changeReq.requestedGender })
    .where(eq(usersTable.id, changeReq.userId));

  const [updated] = await db
    .update(talahTypeChangeRequestsTable)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: "admin",
      adminNotes: adminNotes ?? null,
    })
    .where(eq(talahTypeChangeRequestsTable.id, id))
    .returning();

  await writeAdminAuditLog(req, { action: "approve_talah_type_change", targetTable: "talah_type_change_requests", targetId: id, before: changeReq, after: updated });
  await writeAdminAuditLog(req, { action: "update_user_gender", targetTable: "users", targetId: changeReq.userId, before: { gender: userBefore?.gender }, after: { gender: changeReq.requestedGender } });

  res.json(updated);
});

// POST /api/admin/talah-type-change-requests/:id/reject
router.post("/talah-type-change-requests/:id/reject", requireAdmin, async (req, res) => {
  const id = req.params["id"] as string;
  const { adminNotes } = (req.body ?? {}) as { adminNotes?: string };

  const [changeReq] = await db
    .select()
    .from(talahTypeChangeRequestsTable)
    .where(eq(talahTypeChangeRequestsTable.id, id));

  if (!changeReq) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (changeReq.status !== "pending") {
    res.status(400).json({ error: "Request is not pending" });
    return;
  }

  const [updated] = await db
    .update(talahTypeChangeRequestsTable)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: "admin",
      adminNotes: adminNotes ?? null,
    })
    .where(eq(talahTypeChangeRequestsTable.id, id))
    .returning();

  await writeAdminAuditLog(req, { action: "reject_talah_type_change", targetTable: "talah_type_change_requests", targetId: id, before: changeReq, after: updated });
  res.json(updated);
});

// ── Waitlist ──────────────────────────────────────────────────────────────────
// GET /api/admin/waitlist — return all signups newest-first with total count
router.get("/waitlist", requireAdmin, async (req, res) => {
  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(waitlistSignupsTable)
      .orderBy(desc(waitlistSignupsTable.createdAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(waitlistSignupsTable),
  ]);
  res.json({ data: rows, total: count });
});

export default router;