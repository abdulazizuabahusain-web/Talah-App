# Workspace — Tal'ah / طلعة

## Overview

pnpm workspace monorepo for **Tal'ah**, a privacy-first curated social meetup app for Saudi Arabia.

## Stack

- **Monorepo**: pnpm workspaces · Node 24 · TypeScript 5.9
- **Mobile app**: Expo (React Native) — `artifacts/talah`
- **Admin web app**: React + Vite — `artifacts/admin` (at `/admin/`)
- **API server**: Express 5 — `artifacts/api-server` (at `/api/`)
- **Database**: PostgreSQL + Drizzle ORM — `lib/db`
- **Validation**: Zod 3.x (import from `"zod"` not `"zod/v4"` in esbuild bundles)
- **Build**: esbuild (api-server), Vite (admin)

## Artifacts

| Artifact | Path | Port | Purpose |
|---|---|---|---|
| `artifacts/talah` | `/` | 20433 | Expo mobile app (web preview) |
| `artifacts/api-server` | `/api/` | 8080 | Express REST API |
| `artifacts/admin` | `/admin/` | 23744 | Web admin dashboard |
| `artifacts/mockup-sandbox` | `/__mockup` | 8081 | Canvas component previews |

## Database Schema (`lib/db/src/schema/`)

| Table | Description |
|---|---|
| `users` | User profiles, personality fields, scores |
| `sessions` | Auth session tokens |
| `otp` | One-time passwords (10 min TTL) |
| `requests` | Meetup requests submitted by users |
| `groups` | Curated groups created by admin |
| `feedback` | Post-meetup ratings and comments |
| `reports` | User-to-user reports |

## API Routes (`artifacts/api-server/src/routes/`)

| Route | Auth | Description |
|---|---|---|
| `POST /api/auth/otp/send` | None | Send OTP (returns `code` in dev) |
| `POST /api/auth/otp/verify` | None | Verify OTP → `{ token, user }` |
| `POST /api/auth/logout` | User | Delete session |
| `GET /api/users/me` | User | Get current user profile |
| `PATCH /api/users/me` | User | Update profile / onboarding |
| `DELETE /api/users/me` | User | Delete own account |
| `GET /api/requests` | User | Get own requests |
| `POST /api/requests` | User | Submit a meetup request |
| `DELETE /api/requests/:id` | User | Cancel a pending request |
| `GET /api/groups` | User | Get groups the user belongs to |
| `GET /api/groups/:id` | User (member) | Get one group |
| `POST /api/feedback` | User (member) | Submit feedback for a group |
| `POST /api/reports` | User | Report another user |
| `POST /api/admin/login` | None | PIN login for web dashboard |
| `GET /api/admin/me` | Admin token | Verify admin session |
| `GET /api/admin/users` | Admin | List all users |
| `PATCH /api/admin/users/:id` | Admin | Update a user |
| `DELETE /api/admin/users/:id` | Admin | Delete a user |
| `GET /api/admin/requests` | Admin | List all requests |
| `PATCH /api/admin/requests/:id` | Admin | Update request status |
| `GET /api/admin/groups` | Admin | List all groups |
| `POST /api/admin/groups` | Admin | Create a group |
| `PATCH /api/admin/groups/:id` | Admin | Update group (venue, status) |
| `GET /api/admin/feedback` | Admin | List all feedback |
| `GET /api/admin/reports` | Admin | List all reports |
| `POST /api/admin/compatibility` | Admin | Calculate group compatibility |

## Auth

- **Mobile users**: Phone OTP (`0000` in dev). Sends `Authorization: Bearer <token>` on requests.
- **Admin web dashboard**: PIN `1234` (env `ADMIN_PIN`). Issues in-memory 8-hour admin tokens.

## Admin Dashboard (`artifacts/admin/src/`)

- `pages/LoginPage.tsx` — PIN login
- `pages/DashboardPage.tsx` — main shell with stats and tab navigation
- `components/UsersTab.tsx` — user cards with scores, completion bar, detail modal
- `components/RequestsTab.tsx` — pending/matched/cancelled requests
- `components/GroupsTab.tsx` — group management, venue/status editing
- `components/CompatibilityTab.tsx` — select 3–5 users, run compatibility analysis
- `components/FeedbackTab.tsx` — ratings and comments
- `components/ReportsTab.tsx` — flagged reports
- `lib/api.ts` — typed fetch wrapper, token storage

## Mobile App (`artifacts/talah/`)

- Expo + React Native (web preview enabled)
- Arabic-first (English toggle), RTL per-text
- **Fully wired to the real REST API** (Part 7 complete)
- `lib/api.ts` — typed HTTP client, token stored in AsyncStorage (`talah:token`), all CRUD wrappers
- `contexts/AppContext.tsx` — real 2-step OTP login, auto-hydrates user on startup
- `contexts/DataContext.tsx` — fetches requests + groups from API reactively on login/logout
- 20-step onboarding (steps 0–9: basics; steps 10–19: personality/compatibility)
- Personality scores computed client-side via `lib/types.ts computeScores()`
- Group responses embed member profiles (id, nickname, gender, ageRange, etc.)
- `DELETE /api/users/me` for account deletion (profile screen)

## Key Commands

```bash
pnpm --filter @workspace/db run push          # Push DB schema changes
pnpm --filter @workspace/api-spec run codegen # Regenerate API hooks
pnpm run typecheck                            # Full typecheck all packages
```

## Required Environment Variables (API Server)

| Variable | Environment | Description |
|---|---|---|
| `PAT_EXPIRES_AT` | shared | GitHub PAT expiry date in `YYYY-MM-DD` format (e.g. `2026-06-02`). **Update this in the Replit Secrets panel whenever the PAT is renewed.** Missing → server logs a startup warning and sync-status shows 0 days left. |
| `ADMIN_PIN_HASH` | shared | bcrypt hash of the admin dashboard PIN. Falls back to hash of `"1234"` in dev only. |
| `GITHUB_PAT` | secret | GitHub Personal Access Token for repo sync. |

## Design Tokens (Tal'ah palette)

| Token | Value | Use |
|---|---|---|
| Sand | `#F5EFE6` | Background |
| Olive | `#6B7A4E` | Primary / CTA buttons |
| Gold | `#B8924A` | Accent / highlights |
| Charcoal | `#2A2A2A` | Foreground text |

