# Branch Protection — Active

The `main` branch is protected by a GitHub Ruleset (id `15936943`, enforcement: **active**).

## What the ruleset enforces

| Rule | Description |
|---|---|
| `deletion` | No one can delete the `main` branch |
| `non_fast_forward` | No force-pushes except for admin bypasses |
| `required_status_checks` | CI job `CI / Type Check` must pass before a PR can be merged |

## Bypass actor

`RepositoryRole: admin` (`bypass_mode: always`) — the account that owns this repo
(and the Replit sync PAT) can still force-push. This is required for the
`scripts/post-merge.sh` sync to keep working after every Replit merge.

## Repo visibility

This repository is **public**. GitHub Free only supports branch protection and
repository rulesets on public repositories. Making the repo public had no
security impact because no secrets or credentials are committed to this repo —
all runtime secrets live in Replit environment variables.

## If you need to adjust the ruleset

```bash
# List rulesets
curl -H "Authorization: Bearer $GITHUB_PAT" \
  https://api.github.com/repos/abdulazizuabahusain-web/Talah-App/rulesets

# Update the existing ruleset (id 15936943)
curl -X PUT -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/abdulazizuabahusain-web/Talah-App/rulesets/15936943 \
  -d '{ ... }'
```
