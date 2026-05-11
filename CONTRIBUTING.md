# Contributing to Tal'ah

Thank you for contributing! Please read these guidelines before opening a pull request.

## Workflow

1. **Branch** — Create a branch from `main` for your work. Use a descriptive name, e.g. `feat/add-login`, `fix/crash-on-startup`.
2. **Commit** — Write clear, concise commit messages that explain _what_ changed and _why_.
3. **Pull Request** — Open a PR against `main`. Fill out the PR template fully.
4. **Review** — At least one team member must approve the PR before it can be merged.
5. **Merge** — Once approved and all CI checks pass, the PR can be merged via the GitHub UI. Do not force-push to `main`.

## Branch naming

| Type             | Pattern                     | Example                   |
| ---------------- | --------------------------- | ------------------------- |
| Feature          | `feat/<short-description>`  | `feat/push-notifications` |
| Bug fix          | `fix/<short-description>`   | `fix/auth-redirect`       |
| Chore / refactor | `chore/<short-description>` | `chore/update-deps`       |

## CI checks

Every PR must pass the following checks before merging:

- **Type Check** — `pnpm run typecheck` must exit cleanly.

These run automatically via GitHub Actions on every push and PR.

## Code style

- Follow existing patterns and conventions in each package.
- Never commit secrets, API keys, or environment variables.
- Keep PRs focused — one concern per PR makes reviews easier.

## Questions?

Open a GitHub Discussion or reach out to the repo maintainer.

## Deployment

### Environment profiles

Tal'ah uses two named runtime profiles while keeping Replit Autoscale as the deployment target for both:

| Profile      | Branch/deployment                            | Required profile file     | Notes                                                                         |
| ------------ | -------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `staging`    | `staging` branch → staging Replit deployment | `.env.staging.example`    | Uses staging Replit Secrets and a staging PostgreSQL 16 `DATABASE_URL`.       |
| `production` | `main` branch → production Replit deployment | `.env.production.example` | Uses production Replit Secrets and a production PostgreSQL 16 `DATABASE_URL`. |

The root `.env.example` lists the complete required environment variable checklist. Do not share secrets between staging and production.

### Required GitHub Actions secrets

| Secret name                     | Description                                                                | Where to obtain it                                                                  |
| ------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `REPLIT_DEPLOY_WEBHOOK`         | Production Replit deployment webhook used by production deploy workflows.  | Replit production app → Deployments/Webhooks. Store only in GitHub Actions secrets. |
| `REPLIT_STAGING_DEPLOY_WEBHOOK` | Staging Replit deployment webhook used by `.github/workflows/staging.yml`. | Replit staging app → Deployments/Webhooks. Store only in GitHub Actions secrets.    |

### Branch-to-environment mapping

| Branch    | Environment | Deployment behavior                                                                   |
| --------- | ----------- | ------------------------------------------------------------------------------------- |
| `main`    | Production  | Production release branch. Merge only after review and passing CI.                    |
| `staging` | Staging     | Pushes trigger the staging GitHub Actions workflow and staging Replit deploy webhook. |

### Staging workflow

To test a feature in staging before opening or merging a pull request to `main`, push your feature branch, verify CI, then update the `staging` branch from that feature branch or merge it into `staging`. The `staging` workflow runs `pnpm run typecheck` first; only after typecheck passes does it call `REPLIT_STAGING_DEPLOY_WEBHOOK`. Once staging is verified, open a PR from the feature branch to `main` and include staging test notes in the PR description.
