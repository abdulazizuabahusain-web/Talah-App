import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAuth";

const router = Router();

// GET /api/admin/analytics/overview
router.get("/overview", requireAdmin, async (_req, res) => {
  const client = await pool.connect();
  try {
    const [
      totalUsersResult,
      totalGroupsResult,
      dauResult,
      wauResult,
      avgRatingResult,
      groupsByCityResult,
      signupsByDayResult,
      acceptanceResult,
    ] = await Promise.all([
      client.query<{ count: string }>("SELECT COUNT(*)::int AS count FROM users"),
      client.query<{ count: string }>("SELECT COUNT(*)::int AS count FROM groups WHERE status != 'cancelled'"),
      client.query<{ count: string }>(
        "SELECT COUNT(DISTINCT user_id)::int AS count FROM sessions WHERE created_at >= NOW() - INTERVAL '1 day'",
      ),
      client.query<{ count: string }>(
        "SELECT COUNT(DISTINCT user_id)::int AS count FROM sessions WHERE created_at >= NOW() - INTERVAL '7 days'",
      ),
      client.query<{ avg: string }>(
        "SELECT ROUND(AVG(rating)::numeric, 2) AS avg FROM feedback WHERE created_at >= NOW() - INTERVAL '30 days'",
      ),
      client.query<{ city: string; count: string }>(
        "SELECT city, COUNT(*)::int AS count FROM groups WHERE status != 'cancelled' GROUP BY city",
      ),
      client.query<{ date: string; count: string }>(
        `SELECT DATE(created_at AT TIME ZONE 'Asia/Riyadh') AS date, COUNT(*)::int AS count
         FROM users
         WHERE created_at >= NOW() - INTERVAL '14 days'
         GROUP BY 1
         ORDER BY 1`,
      ),
      client.query<{ completed: string; total: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
           COUNT(*)::int AS total
         FROM groups
         WHERE created_at >= NOW() - INTERVAL '30 days'
           AND status != 'cancelled'`,
      ),
    ]);

    const cityMap: Record<string, number> = {};
    for (const row of groupsByCityResult.rows) {
      cityMap[row.city] = Number(row.count);
    }

    const completed = Number(acceptanceResult.rows[0]?.completed ?? 0);
    const total = Number(acceptanceResult.rows[0]?.total ?? 0);
    const matchAcceptanceRate = total > 0 ? Math.round((completed / total) * 100) / 100 : 0;

    res.json({
      dau: Number(dauResult.rows[0]?.count ?? 0),
      wau: Number(wauResult.rows[0]?.count ?? 0),
      totalUsers: Number(totalUsersResult.rows[0]?.count ?? 0),
      totalGroups: Number(totalGroupsResult.rows[0]?.count ?? 0),
      matchAcceptanceRate,
      avgFeedbackRating: Number(avgRatingResult.rows[0]?.avg ?? 0),
      groupsByCity: cityMap,
      signupsByDay: signupsByDayResult.rows.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
    });
  } finally {
    client.release();
  }
});

// GET /api/admin/analytics/funnel
router.get("/funnel", requireAdmin, async (_req, res) => {
  const client = await pool.connect();
  try {
    const [otpReq, feedback, users, requests, groups] = await Promise.all([
      client.query<{ count: string }>(
        "SELECT COUNT(*)::int AS count FROM otp WHERE created_at >= NOW() - INTERVAL '30 days'",
      ),
      client.query<{ count: string }>(
        "SELECT COUNT(DISTINCT from_user_id)::int AS count FROM feedback WHERE created_at >= NOW() - INTERVAL '30 days'",
      ),
      client.query<{ count: string }>(
        "SELECT COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'",
      ),
      client.query<{ count: string }>(
        "SELECT COUNT(DISTINCT user_id)::int AS count FROM requests WHERE created_at >= NOW() - INTERVAL '30 days'",
      ),
      client.query<{ count: string }>(
        "SELECT COUNT(*)::int AS count FROM groups WHERE status IN ('matched','revealed','completed') AND created_at >= NOW() - INTERVAL '30 days'",
      ),
    ]);

    const otpRequested = Number(otpReq.rows[0]?.count ?? 0);
    const otpVerified = Number(users.rows[0]?.count ?? 0); // new users = verified OTPs
    const profileCompleted = Number(
      (
        await client.query<{ count: string }>(
          "SELECT COUNT(*)::int AS count FROM users WHERE onboarded = true AND created_at >= NOW() - INTERVAL '30 days'",
        )
      ).rows[0]?.count ?? 0,
    );
    const groupRequested = Number(requests.rows[0]?.count ?? 0);
    const matchAccepted = Number(groups.rows[0]?.count ?? 0);
    const feedbackSubmitted = Number(feedback.rows[0]?.count ?? 0);

    res.json({
      otpRequested,
      otpVerified,
      profileCompleted,
      groupRequested,
      matchAccepted,
      feedbackSubmitted,
    });
  } finally {
    client.release();
  }
});

export default router;
