# Branch Protection — Setup Required

The `main` branch of this repository needs protection rules applied manually.
This cannot be done automatically because GitHub requires **GitHub Pro** (or making
the repository public) to enable branch protection on private repositories.

## How to enable protection (two options)

### Option A — Make the repository public (free, instant)

1. Go to **Settings → General → Danger Zone → Change visibility**
2. Set to **Public**
3. Then follow Option B steps below — all features will work immediately

### Option B — Upgrade to GitHub Pro ($4/month)

1. Go to **github.com/settings/billing** and upgrade to Pro
2. Then follow the steps below

## Recommended protection rules for `main`

Go to **Settings → Branches → Add branch ruleset** and configure:

| Setting | Value |
|---|---|
| Ruleset name | `Protect main` |
| Enforcement | Active |
| Target branches | `main` |
| **Rules** | |
| Block force pushes | Enabled (admins bypass — needed for Replit sync) |
| Restrict deletions | Enabled |
| Require status checks | `CI / Type Check` must pass |
| Require pull request before merging | Optional (recommended if you add collaborators) |
| Bypass actors | Repository admin role (so the Replit sync PAT can still force-push) |

## Why force-push must stay allowed for admins

The Replit → GitHub sync in `scripts/post-merge.sh` uses `git push --force`.
If you restrict force-pushes for everyone including admins, the sync will break.
The bypass actor setting (admin role) ensures the PAT can still sync while
preventing accidental overwrites by collaborators.

## What's already in place

- CI runs on every push and PR (`/.github/workflows/ci.yml`)  — typechecks the full monorepo
- CODEOWNERS is set (`/.github/CODEOWNERS`) — GitHub auto-suggests reviewers on PRs
- Replit auto-syncs to this repo on every merge via the post-merge script
