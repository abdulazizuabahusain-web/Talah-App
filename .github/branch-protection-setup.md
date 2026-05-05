# Branch Protection Setup (Manual Steps)

Branch protection rules for private repositories require **GitHub Pro** (or making the repo public). The API returned a 403 for this private repo on the free plan.

Until the plan is upgraded, follow these steps to protect the `main` branch through the GitHub UI:

## How to protect the main branch

1. Go to **Settings → Branches** in the `Talah-App` repository.
2. Under **Branch protection rules**, click **Add branch protection rule** (or **Add rule**).
3. Set **Branch name pattern** to `main`.
4. Enable the following options:
   - **Require a pull request before merging**
     - Set **Required number of approvals** to at least `1`
     - Enable **Dismiss stale pull request approvals when new commits are pushed**
     - Enable **Require review from Code Owners** (uses the `.github/CODEOWNERS` file)
   - **Require status checks to pass before merging**
     - Search for and add `Type Check` (the CI job from `.github/workflows/ci.yml`)
     - Enable **Require branches to be up to date before merging**
   - **Do not allow bypassing the above settings**
   - **Restrict who can push to matching branches** (add only trusted maintainers)
5. Click **Create** (or **Save changes**).

## What's already in place

| Item | Status |
|------|--------|
| `.github/PULL_REQUEST_TEMPLATE.md` | Created — shown automatically when opening a PR |
| `CONTRIBUTING.md` | Created — documents the PR workflow for contributors |
| `.github/CODEOWNERS` | Created — auto-assigns `@abdulazizuabahusain-web` as reviewer on every PR |
| CI type check workflow | Already existed — runs on every push and PR to `main` |

Once branch protection is enabled through the UI, the full review process will be enforced automatically.
