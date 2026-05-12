# Tal'ah — Pilot KPI Baselines

## Target Metrics (Weeks 6–9 Pilot)

| Metric | Target | Red Line (investigate if below) |
|---|---|---|
| D7 Retention | 40% | 25% |
| D14 Retention | 25% | 15% |
| Match Acceptance Rate | 75% | 60% |
| Dining Event Completion Rate | 80% | 65% |
| Average Post-Event Rating | 4.5 / 5 | 4.0 / 5 |
| API Error Rate | < 1% | > 3% |
| API p99 Latency | < 1000ms | > 2000ms |

## How to Read the Dashboard

Use the internal admin Analytics tab as the weekly pilot health snapshot: DAU and WAU show current engagement, Total Users shows acquisition, Match Acceptance Rate and Avg Rating indicate whether matches are trusted and enjoyable, the signups table highlights launch-channel spikes or stalls, and the funnel table shows where consenting users drop from OTP request through feedback submission.

## Weekly Review Cadence

- Product, operations, and engineering review the dashboard every Sunday morning during the Weeks 6–9 pilot.
- Compare each metric to the target and red-line thresholds before discussing feature work.
- If a metric hits the red line, assign an owner the same day, inspect the relevant funnel or Sentry data, and agree on a corrective experiment or operational action.
- Record decisions and follow-ups in the pilot review notes so the next review can confirm recovery or escalation.
