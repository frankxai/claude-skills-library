#!/usr/bin/env bash
# Vendors the risk-classifier into a target repo at .claude/ci/risk-classifier/.
# Usage: ./install.sh /path/to/target-repo
set -euo pipefail

TARGET="${1:?usage: ./install.sh /path/to/target-repo}"
PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$TARGET/.claude/ci/risk-classifier"

[ -d "$TARGET/.git" ] || { echo "error: $TARGET is not a git repo" >&2; exit 1; }

mkdir -p "$DEST"
cp "$PACK_DIR/classes.json" "$DEST/classes.json"
cp "$PACK_DIR/ci/risk-classify.mjs" "$DEST/risk-classify.mjs"

echo "vendored risk-classifier -> $DEST"
echo "run: node $DEST/risk-classify.mjs --root $TARGET --base origin/main"
echo "upgrade by re-running this installer; do not hand-edit the vendored copy."
