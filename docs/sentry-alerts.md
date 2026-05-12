# Sentry Alert Rules

Configure these alert rules manually in the Sentry dashboard for the Tal'ah API and Expo projects.

| Alert | Threshold | Severity | Notification |
|---|---:|---|---|
| API error rate | > 5% over 5 minutes | P1 | Email + placeholder webhook |
| API p99 latency | > 2000ms | P2 | Email |
| New unhandled exception | Any new unhandled exception | P2 | Email |
| Database connection errors | Any database connection error event | P1 | Email + placeholder webhook |

Suggested placeholder webhook: `https://example.invalid/talah/sentry-webhook` until the production incident-management webhook is provisioned.
