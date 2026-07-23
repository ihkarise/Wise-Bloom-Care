#!/usr/bin/env bash
#
# Developer bootstrap (docs/20-Implementation/205 Task 8; docs/04-Architecture/60).
# Idempotent: safe to re-run. Installs dependencies and scaffolds per-environment
# clasp config from the committed template (real .clasp.json is git-ignored).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "▸ Node version (expected $(cat .nvmrc)):"
node --version

if ! command -v pnpm >/dev/null 2>&1; then
  echo "✖ pnpm not found. Enable it with: corepack enable" >&2
  exit 1
fi

echo "▸ Installing workspace dependencies…"
pnpm install

CLASP_TEMPLATE="apps/backend/.clasp.json.example"
CLASP_LOCAL="apps/backend/.clasp.json"
if [[ ! -f "$CLASP_LOCAL" && -f "$CLASP_TEMPLATE" ]]; then
  cp "$CLASP_TEMPLATE" "$CLASP_LOCAL"
  echo "▸ Created $CLASP_LOCAL from template — fill in the dev scriptId (git-ignored)."
fi

echo "▸ Preparing git hooks…"
pnpm run prepare >/dev/null 2>&1 || true

cat <<'EOF'

✔ Bootstrap complete. Next:
  pnpm -r typecheck   # type-check every package
  pnpm -r test        # unit + integration + boundary meta-tests
  pnpm -r build       # build all packages and the web app
  pnpm --filter @wise-bloom/web dev   # run the frontend shell
EOF
