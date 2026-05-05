#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# ── GitHub sync ────────────────────────────────────────────────────────────────
# GITHUB_PAT expiry: 2026-06-02. Rotate in Replit Secrets before that date.
# If the push fails, a GitHub Issue is opened automatically to notify the owner.
PAT_EXPIRY="2026-06-02"
REPO="abdulazizuabahusain-web/Talah-App"

echo "--- Syncing to GitHub ---"

if [ -z "${GITHUB_PAT}" ]; then
  echo "WARNING: GITHUB_PAT secret is not set. Skipping GitHub sync."
  exit 0
fi

GITHUB_URL="https://${GITHUB_PAT}@github.com/${REPO}.git"
git remote remove github 2>/dev/null || true
git remote add github "$GITHUB_URL"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
TIMESTAMP=$(date -u "+%Y-%m-%d %H:%M UTC")

# ── PAT expiry warning ─────────────────────────────────────────────────────────
EXPIRY_EPOCH=$(date -d "${PAT_EXPIRY}" +%s 2>/dev/null || echo 0)
NOW_EPOCH=$(date +%s)
if [ "$EXPIRY_EPOCH" -gt 0 ]; then
  DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -le 14 ] && [ "$DAYS_LEFT" -ge 0 ]; then
    echo "WARNING: GITHUB_PAT expires in ${DAYS_LEFT} day(s) (${PAT_EXPIRY}). Rotate it in Replit Secrets now."
  fi
fi

# ── Push with failure notification ────────────────────────────────────────────
if git push github "${CURRENT_BRANCH}:main" --force 2>&1; then
  git remote remove github 2>/dev/null || true
  echo "--- GitHub sync complete (${COMMIT}) ---"
else
  git remote remove github 2>/dev/null || true

  ISSUE_TITLE="⚠️ GitHub sync failed — ${TIMESTAMP}"
  ISSUE_BODY="The automatic Replit → GitHub sync failed and your code is **not backed up** to GitHub.\n\n**Details**\n- Branch: \`${CURRENT_BRANCH}\` → \`main\`\n- Commit: \`${COMMIT}\`\n- Time: ${TIMESTAMP}\n\n**Possible causes**\n- PAT expired or revoked (current PAT expires **${PAT_EXPIRY}**)\n- Branch protection rule violation (e.g. push blocked by ruleset)\n- Network error\n\n**How to fix**\n1. Check the \`GITHUB_PAT\` secret in Replit — rotate it if expired\n2. Open the Replit post-merge log for the full push error\n3. Manually push: \`git push https://\$GITHUB_PAT@github.com/${REPO}.git main:main --force\`\n4. Close this issue once the sync is restored"

  HTTP=$(curl -s -o /tmp/gh_issue.json -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${GITHUB_PAT}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO}/issues" \
    -d "{\"title\":\"${ISSUE_TITLE}\",\"body\":\"${ISSUE_BODY}\"}")

  if [ "$HTTP" = "201" ]; then
    ISSUE_URL=$(node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).html_url);}catch(e){}});" < /tmp/gh_issue.json)
    echo "ERROR: GitHub sync failed. Notification issue opened: ${ISSUE_URL}" >&2
  else
    echo "ERROR: GitHub sync failed. Could not open notification issue (HTTP ${HTTP})." >&2
  fi

  exit 1
fi
