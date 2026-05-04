# Branch Protection — Active

The `main` branch is protected by a GitHub Ruleset (id `15936943`, enforcement: **active**).

## What the ruleset enforces

| Rule | Description |
|---|---|
| `deletion` | No one can delete the `main` branch |
| `non_fast_forward` | Force-pushes blocked for everyone except the bypass actor |
| `required_status_checks` | CI job `CI / Type Check` must pass before a PR can be merged |

## Bypass actor (least privilege)

| Field | Value |
|---|---|
| `actor_type` | `User` |
| `actor_id` | `280890304` (`@abdulazizuabahusain-web`) |
| `bypass_mode` | `always` |

Only this specific user account can bypass the ruleset. This is the same account
whose PAT runs the `scripts/post-merge.sh` sync, so force-pushes from Replit
keep working while no other account can bypass protections.

## Repo visibility

This repository is **public**. GitHub Free only supports rulesets on public
repositories. Making it public had no security impact — no secrets or credentials
are committed here; all runtime secrets live in Replit environment variables.

## Managing the ruleset

```bash
# Inspect the active ruleset
curl -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/abdulazizuabahusain-web/Talah-App/rulesets/15936943

# Update it (PUT replaces the full ruleset)
curl -X PUT -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/abdulazizuabahusain-web/Talah-App/rulesets/15936943 \
  -d '{ ... }'
```
