# Sentry Alert Rules

Configure these rules manually in the Sentry dashboard after the production project is created and releases/environments are reporting correctly.

| Rule                          | Condition                                                                                                                          | Filter                                               | Action                                             | Response priority |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ----------------- |
| Production error spike        | More than 50 error events in 5 minutes                                                                                             | `environment:production`                             | Notify on-call channel and create/assign issue     | P1                |
| High p99 transaction duration | p99 transaction duration exceeds 2000 ms                                                                                           | `environment:production`, transactions only          | Notify engineering channel and tag backend owner   | P2                |
| New unhandled exception type  | First seen unhandled exception type in production                                                                                  | `environment:production`, `handled:false`, new issue | Notify engineering channel and assign triage owner | P2                |
| Database/connection failures  | Issues matching `database`, `ECONNREFUSED`, `connection refused`, or PostgreSQL connection keywords more than 3 times in 5 minutes | `environment:production` and keyword query           | Page on-call and create incident note              | P1                |

## Response notes

- P1 alerts require immediate acknowledgement and user-impact assessment.
- P2 alerts should be triaged during business hours unless paired with user reports or a reliability regression.
- Keep alert messages concise and link to this runbook plus the affected Sentry issue.
