# KPI Baselines

## Pilot success metrics

| Metric name                  | Target value        | Red line value      |
| ---------------------------- | ------------------- | ------------------- |
| D7 Retention                 | 40%                 | 25%                 |
| D14 Retention                | 25%                 | 15%                 |
| Match Acceptance Rate        | 75%                 | 60%                 |
| Dining Event Completion Rate | 80%                 | 65%                 |
| Average Post-Event Rating    | 4.5 / 5             | 4.0 / 5             |
| API Error Rate               | Below 1%            | Above 3%            |
| API p99 Latency              | Below 1000 ms       | Above 2000 ms       |
| Beta Invite Acceptance Rate  | 80% within 48 hours | 60% within 48 hours |

## Reading the admin analytics dashboard

Use the admin analytics dashboard as the weekly source of truth for funnel and quality metrics. Review the selected date range, confirm that the environment is production, compare each metric to its target and red line, and annotate major operational events such as outages, beta invite waves, venue changes, or delayed group reveals before interpreting trends.

## Weekly review cadence

- **Owner:** Product lead reviews business metrics; engineering lead reviews reliability metrics; operations lead reviews event completion and feedback quality.
- **When:** Every Sunday morning before the weekly planning meeting.
- **Format:** 30-minute review using the dashboard, exported screenshots, and a short written summary in the team channel.
- **When a red line is hit:** Open an incident or action item within 24 hours, assign an owner, document the suspected cause, and agree on a mitigation experiment or rollback plan before the next invite or dining-event batch.
