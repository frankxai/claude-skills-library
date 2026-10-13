#!/usr/bin/env bash
# sync-upstream.sh — re-vendor the framework kits from blencorp/claude-code-kit.
#
#   ./sync-upstream.sh               # sync to upstream HEAD
#   ./sync-upstream.sh <commit>      # sync to a specific commit
#   ./sync-upstream.sh --check       # report drift against HEAD, change nothing
#
# skills/<kit>/ and rules/kits/<kit>.json are verbatim copies; never hand-edit
# them. Estate behavior belongs in rules/estate.json and hooks/.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="https://github.com/blencorp/claude-code-kit"
KITS="nextjs react tailwindcss shadcn"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/stack-kits-sync.XXXXXXXX")"
trap 'rm -rf "$WORK"' EXIT

CHECK=0; REF=""
case "${1:-}" in
  --check) CHECK=1 ;;
  "") ;;
  *) REF="$1" ;;
esac

git clone --quiet "$REPO" "$WORK/src"
[ -n "$REF" ] && git -C "$WORK/src" checkout --quiet "$REF"
COMMIT="$(git -C "$WORK/src" rev-parse HEAD)"

drift=0
for kit in $KITS; do
  src="$WORK/src/cli/kits/$kit/skills/$kit"
  [ -d "$src" ] || { echo "upstream no longer ships $kit" >&2; exit 1; }
  stage="$WORK/stage/$kit"
  mkdir -p "$stage"
  cp -R "$src/." "$stage/"
  mv "$stage/skill-rules-fragment.json" "$WORK/stage/$kit.fragment.json"
  cp "$WORK/src/LICENSE" "$stage/UPSTREAM-LICENSE"
  if ! diff -rq "$stage" "$PACK_DIR/skills/$kit" >/dev/null 2>&1 \
     || ! cmp -s "$WORK/stage/$kit.fragment.json" "$PACK_DIR/rules/kits/$kit.json"; then
    drift=1
    echo "drift  $kit"
    if [ $CHECK -eq 0 ]; then
      rm -rf "$PACK_DIR/skills/$kit"
      cp -R "$stage" "$PACK_DIR/skills/$kit"
      cp "$WORK/stage/$kit.fragment.json" "$PACK_DIR/rules/kits/$kit.json"
    fi
  else
    echo "same   $kit"
  fi
done

if [ $CHECK -eq 1 ]; then
  echo "upstream HEAD $COMMIT"
  exit $drift
fi

cat >"$PACK_DIR/rules/upstream.json" <<JSON
{
  "_comment": "Written by sync-upstream.sh. The commit every file under skills/ and rules/kits/ was copied from.",
  "source": "$REPO",
  "commit": "$COMMIT",
  "synced": "$(date -u +%Y-%m-%d)"
}
JSON
echo "pinned $COMMIT — update the table in SOURCES.md, run the tests, then re-run install.sh in each repo"
