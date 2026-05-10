# Tal'ah On-Call Runbook

## On-call contacts

| Name                   | Phone              | WhatsApp                     |
| ---------------------- | ------------------ | ---------------------------- |
| Primary on-call        | `+966-__-___-____` | `https://wa.me/966_________` |
| Backup engineer        | `+966-__-___-____` | `https://wa.me/966_________` |
| Product/business owner | `+966-__-___-____` | `https://wa.me/966_________` |

## Service overview

Tal'ah helps women request curated coffee or dining meetups, complete onboarding profiles, receive group matches, and view event details. If the API goes down, mobile sign-in, onboarding, request creation, admin moderation, group matching, audit-log access, and push-triggered reveal/event flows may stop working or show stale data.

## Alert response matrix

| Scenario                         | Likely cause                                                                            | First response                                                                                                    | Escalation path                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| API returning 5xx errors         | Bad deploy, unhandled exception, DB outage, missing secret                              | Check Replit logs, `/api/healthz`, `/api/readyz`, and recent deploy SHA; roll back if errors started after deploy | Backend on-call → Replit owner → product owner if user-facing outage exceeds 15 minutes     |
| Database connection failures     | Expired `DATABASE_URL`, database maintenance, network issue, connection pool exhaustion | Check `/api/readyz`, Replit database console, pool logs, and active connection count                              | Backend on-call → DB/Replit support → product owner for incident comms                      |
| Push notification failures       | Invalid Expo token, Expo service issue, payload error, app permission issue             | Check API logs around `sendPushToMany`, Expo dashboard status, and sample failed token payloads                   | Mobile owner → Expo dashboard/admin → product owner if event reminders/reveals are impacted |
| High API latency above 2 seconds | Slow DB query, cold start, Replit resource pressure, external API delay                 | Check p95/p99 latency, DB query volume, Replit CPU/memory, and admin sync-status GitHub calls                     | Backend on-call → Replit owner → consider temporary feature disable or scale-up             |
| CI failing on `main`             | Type error, dependency lock mismatch, flaky test, broken generated client               | Open the failed GitHub Actions run, inspect first failing command, reproduce locally with `pnpm run typecheck`    | PR author → reviewer → repo maintainer for branch protection override only if urgent        |

## Restore from backup procedure

1. Open GitHub Actions for the repository and find the latest successful backup workflow run.
2. Download the backup artifact for the target environment and verify the timestamp and environment label.
3. Decompress the artifact locally or in a trusted recovery shell, for example `tar -xzf talah-db-backup-YYYYMMDD.tar.gz`.
4. Inspect the archive contents and identify the PostgreSQL dump file, for example `talah.dump` or `talah.sql`.
5. Put the application in maintenance mode or temporarily stop write traffic from Replit.
6. Restore to PostgreSQL using the matching dump format, for example `pg_restore --clean --if-exists --dbname "$DATABASE_URL" talah.dump` or `psql "$DATABASE_URL" < talah.sql`.
7. Run row-count checks for core tables such as `users`, `requests`, `groups`, `sessions`, and `admin_audit_logs`.
8. Start the application, check `/api/readyz`, then complete a smoke test for login, request listing, and admin dashboard access.
9. Record the restore timestamp, backup artifact name, row counts, and operator name in the incident notes.

## Rollback procedure

### Replit dashboard rollback

1. Open the Replit dashboard for the affected environment.
2. Locate Deployments and identify the last known-good deployment by timestamp and commit SHA.
3. Click rollback/redeploy for that deployment.
4. Watch logs until the API starts successfully.
5. Verify `/api/healthz`, `/api/readyz`, mobile login, and admin login.

### Git revert rollback

1. Identify the bad commit SHA from GitHub, Replit logs, or `/api/version`.
2. Create a rollback branch: `git checkout -b rollback/<short-reason> main`.
3. Revert the bad change: `git revert <bad-sha>`.
4. Run `pnpm run typecheck` and relevant tests.
5. Open and merge an emergency PR, or follow the approved emergency process.
6. Deploy and verify health checks and smoke tests.

## Contacts and links

| Resource                | URL / location                                                 | Notes                            |
| ----------------------- | -------------------------------------------------------------- | -------------------------------- |
| GitHub repo             | `https://github.com/abdulazizuabahusain-web/Talah-App`         | Source, PRs, issues, Actions     |
| Replit dashboard        | `TODO: add Replit dashboard URL`                               | Production app and logs          |
| Replit database console | `TODO: add DB console URL`                                     | PostgreSQL console/backups       |
| Sentry                  | `TODO: add Sentry project URL`                                 | Error and performance monitoring |
| Mixpanel                | `TODO: add Mixpanel project URL`                               | Product analytics                |
| Expo dashboard          | `TODO: add Expo project URL`                                   | Push tokens/builds               |
| GitHub Actions          | `https://github.com/abdulazizuabahusain-web/Talah-App/actions` | CI, staging deploys, backups     |
