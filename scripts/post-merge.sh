#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

echo "--- Syncing to GitHub ---"
if [ -z "${GITHUB_PAT}" ]; then
  echo "WARNING: GITHUB_PAT secret is not set. Skipping GitHub sync."
else
  GITHUB_URL="https://${GITHUB_PAT}@github.com/abdulazizuabahusain-web/Talah-App.git"
  git remote remove github 2>/dev/null || true
  git remote add github "$GITHUB_URL"
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git push github "${CURRENT_BRANCH}:main" --force
  git remote remove github
  echo "--- GitHub sync complete ---"
fi
