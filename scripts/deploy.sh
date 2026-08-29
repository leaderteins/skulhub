#!/bin/bash
# =============================================================================
# SkulHub — One-command deploy script
# =============================================================================
# Pushes the academic calendar fix to GitHub → Vercel auto-deploys.
# Optionally toggles repo visibility (public → private) after deploy.
#
# USAGE:
#   GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx bash scripts/deploy.sh
#
# OR if you want to also flip the repo to private after pushing:
#   GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx bash scripts/deploy.sh --private
#
# OR if you want to make the repo public:
#   GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx bash scripts/deploy.sh --public
#
# Get a token from: https://github.com/settings/tokens (classic, "repo" scope)
# =============================================================================
set -e

if [ -z "$GH_TOKEN" ]; then
  echo "❌ ERROR: GH_TOKEN environment variable is required"
  echo "   Create one at https://github.com/settings/tokens (classic, 'repo' scope)"
  echo "   Then run: GH_TOKEN=ghp_xxx... bash scripts/deploy.sh"
  exit 1
fi

REPO="leaderteins/skulhub"
cd "$(dirname "$0")/.."

echo "========================================"
echo "  SkulHub Deploy Script"
echo "========================================"
echo ""

# 1) Set the remote URL with the token
echo "📡 Configuring git remote with token..."
git remote set-url origin "https://leaderteins:${GH_TOKEN}@github.com/${REPO}.git"

# 2) Show what will be pushed
echo ""
echo "📋 Commits to push:"
git log origin/main..HEAD --oneline 2>/dev/null || git log --oneline -5
echo ""

# 3) Push to GitHub (triggers Vercel auto-deploy)
echo "🚀 Pushing to GitHub..."
git push origin main
echo ""
echo "✅ Push successful! Vercel will auto-deploy in ~2 minutes."
echo "   Watch the build at: https://vercel.com/leaderteins/skulhub"

# 4) Optionally toggle repo visibility
VISIBILITY_FLAG=""
if [ "$1" = "--private" ]; then
  VISIBILITY_FLAG='"private":true'
  echo ""
  echo "🔒 Making repo PRIVATE..."
elif [ "$1" = "--public" ]; then
  VISIBILITY_FLAG='"private":false'
  echo ""
  echo "🌐 Making repo PUBLIC..."
fi

if [ -n "$VISIBILITY_FLAG" ]; then
  HTTP_CODE=$(curl -s -o /tmp/repo-resp.json -w "%{http_code}" \
    -X PATCH \
    -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO" \
    -d "{$VISIBILITY_FLAG}")
  
  if [ "$HTTP_CODE" = "200" ]; then
    PRIVATE=$(python3 -c "import json; print('private' if json.load(open('/tmp/repo-resp.json'))['private'] else 'PUBLIC')" 2>/dev/null || echo "unknown")
    echo "✅ Repo is now: $PRIVATE"
    echo "   URL: https://github.com/$REPO"
  else
    echo "⚠️  Visibility change failed (HTTP $HTTP_CODE). Repo may already be in the desired state."
    cat /tmp/repo-resp.json | head -5
  fi
fi

# 5) Clean up — strip the token from the remote URL for hygiene
echo ""
echo "🧹 Cleaning up (stripping token from git config)..."
git remote set-url origin "https://github.com/${REPO}.git"

echo ""
echo "========================================"
echo "  ✅ DEPLOY COMPLETE"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Wait ~2 min for Vercel to build"
echo "  2. Visit https://skulhub.co.ke"
echo "  3. Login → check the header badge shows the correct term/year"
echo "  4. The live clock should tick every second"
echo ""
