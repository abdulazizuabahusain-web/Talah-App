# Tal'ah — Pilot KPI Baselines

## Target Metrics (Weeks 6–9 Pilot)

| Metric | Target | Red Line (investigate if below/above) |
|---|---|---|
| D7 Retention | 40% | < 25% |
| D14 Retention | 25% | < 15% |
| Match Acceptance Rate | 75% | < 60% |
| Dining Event Completion Rate | 80% | < 65% |
| Average Post-Event Rating | 4.5 / 5 | < 4.0 / 5 |
| API Error Rate | < 1% | > 3% |
| API p99 Latency | < 1000ms | > 2000ms |

## How to Read the Dashboard

Log into the Tal'ah admin panel and click the **Analytics** tab. The top row shows today's Daily Active Users (DAU) and Weekly Active Users (WAU) — these count distinct users with at least one session in the respective window. Below that, three cards show total registered users, match acceptance rate (completed groups / all non-cancelled groups in the last 30 days), and average post-event rating. The bar chart visualises new signups per day over the last two weeks, which is the fastest indicator of growth momentum. Below the chart, the funnel table shows conversion at each step — from OTP request through to feedback submission — with the drop-off percentage between steps highlighted; any step with > 40% drop-off warrants investigation.

## Weekly Review Cadence

- **Who reviews**: Founding team (product + ops)
- **When**: Every Sunday at 10:00 AM AST, before the weekly team sync
- **Format**: Screenshot the Analytics tab and share in the ops WhatsApp group
- **Red-line protocol**:
  - If any metric hits its red line, the responsible owner (product for retention/ratings, engineering for latency/errors) posts a root-cause note in the group within 24 hours
  - If two consecutive weekly reviews show a metric below the red line, pause new user onboarding and convene a response meeting within 48 hours
  - API error rate or p99 latency red lines are treated as incidents and follow the Sentry P1/P2 alert runbook in `docs/sentry-alerts.md`
