#!/usr/bin/env bash
# film-excellence — install into a target repo.
# Idempotent: re-run to upgrade. --dry-run shows what would change.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-}"
DRY_RUN=0

for arg in "$@"; do
  [ "$arg" = "--dry-run" ] && DRY_RUN=1
done

if [ -z "$TARGET" ] || [ "$TARGET" = "--dry-run" ]; then
  echo "usage: install.sh /path/to/repo [--dry-run]" >&2
  exit 2
fi

if [ ! -d "$TARGET" ]; then
  echo "error: target '$TARGET' is not a directory" >&2
  exit 1
fi

say() { echo "  $*"; }
run() { if [ "$DRY_RUN" = "1" ]; then say "would: $*"; else "$@"; fi; }

echo "film-excellence → $TARGET"

# 1. The release-gate skill.
run mkdir -p "$TARGET/.claude/skills/film-release-gate"
run cp "$PACK_DIR/skills/film-release-gate/SKILL.md" \
       "$TARGET/.claude/skills/film-release-gate/SKILL.md"
say "installed skill: film-release-gate"

# 2. Doctrine + reference docs, alongside the skill so they load together.
run mkdir -p "$TARGET/.claude/skills/film-release-gate/reference"
for f in DOCTRINE.md LANGUAGE.md CREW.md PIPELINE.md; do
  run cp "$PACK_DIR/$f" "$TARGET/.claude/skills/film-release-gate/reference/$f"
  say "installed reference: $f"
done

# 3. Templates — copied only if absent. Never overwrite a filled contract.
for f in film-design.md film-taste.md; do
  if [ -e "$TARGET/$f" ]; then
    say "kept existing $f (a filled contract outranks the template)"
  else
    run cp "$PACK_DIR/$f" "$TARGET/$f"
    say "installed template: $f"
  fi
done

run mkdir -p "$TARGET/.claude/templates/film"
run cp -r "$PACK_DIR/templates/." "$TARGET/.claude/templates/film/"
say "installed templates: story-bible, character-dossier, shotlist.schema"

cat <<'EOF'

Done. Add one line to the repo's CLAUDE.md:

  Film / narrative video work goes through the `film-release-gate` skill first.
  See `.claude/skills/film-release-gate/SKILL.md`. This repo's own
  `film-design.md` and `film-taste.md` outrank every skill in the pack.

EOF
