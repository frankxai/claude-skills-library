#!/usr/bin/env bash
# install.sh — install the agent-infrastructure pack into a repo.
#
#   ./install.sh /path/to/repo              # install / upgrade the nine skills
#   ./install.sh /path/to/repo --dry-run    # show what would change
#
# From anywhere, without cloning first:
#   git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
#     && /tmp/csl/packs/agent-infrastructure/install.sh "$PWD"
#
# Idempotent. A copy already matching canon is left untouched and reported
# `ok`. A copy that DIVERGES from canon is never overwritten silently: it is
# set aside to .claude/skills/.replaced/<name>/ and named in the output, so a
# deliberate local fork (FrankX's swarm-orchestration rewrite, see SOURCES.md)
# survives on disk and the divergence is impossible to miss.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "$PACK_DIR/../.." && pwd)"
TARGET="${1:-}"
shift || true
DRY=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "usage: install.sh <path-to-repo> [--dry-run]" >&2
  exit 2
fi
TARGET="$(cd "$TARGET" && pwd)"

say() { printf '%s\n' "$*"; }
run() { if [ $DRY -eq 1 ]; then say "  would: $*"; else "$@"; fi; }

say "agent-infrastructure → $TARGET"
[ $DRY -eq 1 ] && say "(dry run — nothing will be written)"

# ---------------------------------------------------------------- skills
DEST_SKILLS="$TARGET/.claude/skills"
run mkdir -p "$DEST_SKILLS"
DIVERGED=""
while IFS= read -r entry; do
  case "$entry" in ''|'#'*) continue ;; esac
  src="$LIB_DIR/$entry"
  name="$(basename "$entry")"
  if [ ! -d "$src" ]; then
    echo "!! manifest entry '$entry' does not exist in the library — fix manifest.txt" >&2
    exit 1
  fi
  if [ -d "$DEST_SKILLS/$name" ]; then
    if diff -rq "$src" "$DEST_SKILLS/$name" >/dev/null 2>&1; then
      say "  ok     $name (already canonical)"
      continue
    fi
    # Never delete a diverged copy — it may be a deliberate local fork.
    say "  DIVERGED $name — local copy differs from canon; preserved at .claude/skills/.replaced/$name"
    DIVERGED="$DIVERGED $name"
    run mkdir -p "$DEST_SKILLS/.replaced"
    run rm -rf "$DEST_SKILLS/.replaced/$name"
    run mv "$DEST_SKILLS/$name" "$DEST_SKILLS/.replaced/$name"
  else
    say "  add    $name"
  fi
  run cp -R "$src" "$DEST_SKILLS/$name"
done <"$PACK_DIR/manifest.txt"

# ---------------------------------------------------------------- gitignore
GI="$TARGET/.gitignore"
if [ $DRY -eq 1 ]; then
  say "  would: ensure .claude/skills/.replaced/ is gitignored"
elif [ -f "$GI" ] && grep -q '^\.claude/skills/\.replaced/' "$GI"; then
  :
else
  {
    echo ""
    echo "# agent-infrastructure pack — diverged copies set aside by install.sh"
    echo ".claude/skills/.replaced/"
  } >>"$GI"
  say "  ignore .claude/skills/.replaced/"
fi

say ""
if [ -n "$DIVERGED" ]; then
  say "Diverged copies were set aside, not deleted:$DIVERGED"
  say "Review each under .claude/skills/.replaced/. If one is a deliberate local"
  say "fork, rename it (a different name = a different skill, no longer drift)"
  say "and move it back; if it is rot, delete it. SOURCES.md records the known ones."
  say ""
fi
if [ $DRY -eq 1 ]; then
  say "Dry run complete — nothing was written."
else
  say "Installed. Verify with:"
  say "  ls $TARGET/.claude/skills"
fi
