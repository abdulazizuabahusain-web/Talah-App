# Contributing to Tal'ah

Thank you for contributing! Please read these guidelines before opening a pull request.

## Workflow

1. **Branch** — Create a branch from `main` for your work. Use a descriptive name, e.g. `feat/add-login`, `fix/crash-on-startup`.
2. **Commit** — Write clear, concise commit messages that explain *what* changed and *why*.
3. **Pull Request** — Open a PR against `main`. Fill out the PR template fully.
4. **Review** — At least one team member must approve the PR before it can be merged.
5. **Merge** — Once approved and all CI checks pass, the PR can be merged via the GitHub UI. Do not force-push to `main`.

## Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/push-notifications` |
| Bug fix | `fix/<short-description>` | `fix/auth-redirect` |
| Chore / refactor | `chore/<short-description>` | `chore/update-deps` |

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
