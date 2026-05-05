#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# ── GitHub sync ────────────────────────────────────────────────────────────────
# GITHUB_PAT expiry: 2026-06-02. Rotate in Replit Secrets before that date.
# On push failure a GitHub Issue is opened as a secondary alert.
# The primary alert is always printed to stderr (captured by Replit post-merge log).
PAT_EXPIRY="2026-06-02"
REPO="abdulazizuabahusain-web/Talah-App"

echo "--- Syncing to GitHub ---"

if [ -z "${GITHUB_PAT}" ]; then
  echo "ERROR: GITHUB_PAT secret is not set. Code is NOT backed up to GitHub." >&2
  exit 1
fi

# ── PAT expiry warning (always runs, even if push later fails) ─────────────────
EXPIRY_EPOCH=$(date -d "${PAT_EXPIRY}" +%s 2>/dev/null || echo 0)
NOW_EPOCH=$(date +%s)
if [ "$EXPIRY_EPOCH" -gt 0 ]; then
  DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -le 14 ] && [ "$DAYS_LEFT" -ge 0 ]; then
    echo "WARNING: GITHUB_PAT expires in ${DAYS_LEFT} day(s) (${PAT_EXPIRY}). Rotate it in Replit Secrets now." >&2
  fi
fi

# ── Pre-push PAT validity check ────────────────────────────────────────────────
# Detects expired/revoked tokens BEFORE the push so the error message is specific.
PAT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${GITHUB_PAT}" \
  https://api.github.com/user || echo "000")

if [ "$PAT_STATUS" != "200" ]; then
  cat >&2 <<EOF
ERROR: GitHub sync skipped — GITHUB_PAT is invalid or expired (HTTP ${PAT_STATUS}).
  - Expiry date on record: ${PAT_EXPIRY}
  - Rotate the token at https://github.com/settings/tokens
  - Update the GITHUB_PAT secret in Replit Secrets
  - Update PAT_EXPIRY in scripts/post-merge.sh
  Code is NOT backed up to GitHub.
EOF
  exit 1
fi

# ── Push ───────────────────────────────────────────────────────────────────────
GITHUB_URL="https://${GITHUB_PAT}@github.com/${REPO}.git"
git remote remove github 2>/dev/null || true
git remote add github "$GITHUB_URL"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
TIMESTAMP=$(date -u "+%Y-%m-%d %H:%M UTC")

if git push github "${CURRENT_BRANCH}:main" --force 2>&1; then
  git remote remove github 2>/dev/null || true
  echo "--- GitHub sync complete (${COMMIT}) ---"
else
  PUSH_EXIT=$?
  git remote remove github 2>/dev/null || true

  # ── Primary alert: stderr (always visible in Replit post-merge log) ──────────
  cat >&2 <<EOF
ERROR: GitHub sync FAILED (exit ${PUSH_EXIT}).
  Branch : ${CURRENT_BRANCH} → main
  Commit : ${COMMIT}
  Time   : ${TIMESTAMP}
  Cause  : branch protection rule violation, network error, or permission issue
  Fix    : check Replit post-merge log and https://github.com/${REPO}/issues
  Code is NOT backed up to GitHub until this is resolved.
EOF

  # ── Secondary alert: GitHub Issue (best-effort, PAT already validated above) ──
  if command -v jq >/dev/null 2>&1; then
    ISSUE_BODY=$(jq -n \
      --arg branch "${CURRENT_BRANCH}" \
      --arg commit "${COMMIT}" \
      --arg ts "${TIMESTAMP}" \
      --arg expiry "${PAT_EXPIRY}" \
      --arg repo "${REPO}" \
      '{
        title: ("⚠️ GitHub sync failed — " + $ts),
        body: ("The automatic Replit → GitHub sync failed. **Code is not backed up.**\n\n**Details**\n- Branch: `" + $branch + "` → `main`\n- Commit: `" + $commit + "`\n- Time: " + $ts + "\n\n**Possible causes**\n- Branch protection rule violation\n- Network / DNS error\n- PAT permissions changed (PAT expires **" + $expiry + "**)\n\n**How to fix**\n1. Check the Replit post-merge log for the full push error\n2. Confirm `GITHUB_PAT` is valid in Replit Secrets\n3. Manually push: `git push https://$GITHUB_PAT@github.com/" + $repo + ".git main:main --force`\n4. Close this issue once the sync is restored")
      }')
  else
    SAFE_BRANCH=$(printf '%s' "${CURRENT_BRANCH}" | sed 's/"/\\"/g')
    SAFE_COMMIT=$(printf '%s' "${COMMIT}" | sed 's/"/\\"/g')
    ISSUE_BODY="{\"title\":\"⚠️ GitHub sync failed — ${TIMESTAMP}\",\"body\":\"GitHub sync failed.\\n\\nBranch: ${SAFE_BRANCH} → main\\nCommit: ${SAFE_COMMIT}\\nTime: ${TIMESTAMP}\\nPAT expires: ${PAT_EXPIRY}\\n\\nCheck the Replit post-merge log for details.\"}"
  fi

  HTTP=$(curl -s -o /tmp/gh_issue.json -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${GITHUB_PAT}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO}/issues" \
    -d "${ISSUE_BODY}" || echo "000")

  if [ "$HTTP" = "201" ]; then
    ISSUE_URL=$(jq -r '.html_url // empty' /tmp/gh_issue.json 2>/dev/null || echo "")
    echo "Notification issue opened: ${ISSUE_URL}" >&2
  else
    echo "Note: could not open GitHub notification issue (HTTP ${HTTP}). Check the Replit log above." >&2
  fi

  exit 1
fi
