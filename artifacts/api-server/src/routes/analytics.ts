import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAuth";

const router = Router();

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

router.get("/overview", requireAdmin, async (_req, res) => {
  const [overview, groupsByCity, signupsByDay] = await Promise.all([
    pool.query(`
      with decisions as (
        select
          count(*) filter (where event_name = 'match_accepted')::int as accepted,
          count(*) filter (where event_name = 'match_declined')::int as declined
        from events
        where created_at >= now() - interval '30 days'
      )
      select
        (select count(distinct user_id)::int from events where user_id is not null and created_at::date = current_date) as dau,
        (select count(distinct user_id)::int from events where user_id is not null and created_at >= now() - interval '7 days') as wau,
        (select count(*)::int from users) as "totalUsers",
        (select count(*)::int from groups) as "totalGroups",
        coalesce((select accepted::float / nullif(accepted + declined, 0) from decisions), 0) as "matchAcceptanceRate",
        coalesce((select avg(rating)::float from feedback where created_at >= now() - interval '30 days'), 0) as "avgFeedbackRating"
    `),
    pool.query(`
      select lower(city) as city, count(*)::int as count
      from groups
      group by lower(city)
    `),
    pool.query(`
      with days as (
        select generate_series(current_date - interval '13 days', current_date, interval '1 day')::date as day
      )
      select days.day::text as date, coalesce(count(users.id), 0)::int as count
      from days
      left join users on users.created_at::date = days.day
      group by days.day
      order by days.day
    `),
  ]);

  const row = overview.rows[0] ?? {};
  const cityCounts: Record<string, number> = { riyadh: 0, jeddah: 0, eastern: 0 };
  for (const cityRow of groupsByCity.rows) {
    const city = String(cityRow.city ?? "");
    if (city.includes("riyadh") || city.includes("الرياض")) cityCounts.riyadh += toNumber(cityRow.count);
    if (city.includes("jeddah") || city.includes("جدة")) cityCounts.jeddah += toNumber(cityRow.count);
    if (city.includes("eastern") || city.includes("الشرقية") || city.includes("dammam") || city.includes("khobar")) {
      cityCounts.eastern += toNumber(cityRow.count);
    }
  }

  res.json({
    dau: toNumber(row.dau),
    wau: toNumber(row.wau),
    totalUsers: toNumber(row.totalUsers),
    totalGroups: toNumber(row.totalGroups),
    matchAcceptanceRate: toNumber(row.matchAcceptanceRate),
    avgFeedbackRating: toNumber(row.avgFeedbackRating),
    groupsByCity: cityCounts,
    signupsByDay: signupsByDay.rows.map((r) => ({ date: r.date, count: toNumber(r.count) })),
  });
});

router.get("/funnel", requireAdmin, async (_req, res) => {
  const result = await pool.query(`
    select
      count(*) filter (where event_name = 'otp_requested')::int as "otpRequested",
      count(*) filter (where event_name = 'otp_verified')::int as "otpVerified",
      count(*) filter (where event_name = 'profile_completed')::int as "profileCompleted",
      count(*) filter (where event_name = 'group_requested')::int as "groupRequested",
      count(*) filter (where event_name = 'match_accepted')::int as "matchAccepted",
      count(*) filter (where event_name = 'feedback_submitted')::int as "feedbackSubmitted"
    from events
    where created_at >= now() - interval '30 days'
  `);

  const row = result.rows[0] ?? {};
  res.json({
    otpRequested: toNumber(row.otpRequested),
    otpVerified: toNumber(row.otpVerified),
    profileCompleted: toNumber(row.profileCompleted),
    groupRequested: toNumber(row.groupRequested),
    matchAccepted: toNumber(row.matchAccepted),
    feedbackSubmitted: toNumber(row.feedbackSubmitted),
  });
});

export default router;
