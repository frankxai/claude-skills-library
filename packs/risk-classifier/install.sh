#!/usr/bin/env bash
# Vendors the risk-classifier into a target repo at .claude/ci/risk-classifier/.
# Works for normal checkouts and git worktrees (where .git is a pointer file).
# Usage: ./install.sh /path/to/target-repo
set -euo pipefail

TARGET="${1:?usage: ./install.sh /path/to/target-repo}"
PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TOPLEVEL="$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null)" \
  || { echo "error: $TARGET is not inside a git checkout or worktree" >&2; exit 1; }
RESOLVED_TARGET="$(cd "$TARGET" && pwd -P)"
[ "$TOPLEVEL" = "$RESOLVED_TARGET" ] \
  || { echo "error: $TARGET is not a repository top-level (top-level is $TOPLEVEL)" >&2; exit 1; }

DEST="$TOPLEVEL/.claude/ci/risk-classifier"
mkdir -p "$DEST"
cp "$PACK_DIR/classes.json" "$DEST/classes.json"
cp "$PACK_DIR/ci/risk-classify.mjs" "$DEST/risk-classify.mjs"

echo "vendored risk-classifier -> $DEST"
echo "optional per-repo allowlist: $DEST/overrides.json  (may only add \"paths\" to non-gating classes)"
echo "run: node $DEST/risk-classify.mjs --root $TOPLEVEL --base origin/main"
echo "upgrade by re-running this installer; do not hand-edit the vendored copy."
