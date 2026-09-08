#!/usr/bin/env bash
# install.sh — install the routine-contract pack into a repo.
#
#   ./install.sh /path/to/repo              # skill + script + CI + config seed
#   ./install.sh /path/to/repo --dry-run    # show what would change
#   ./install.sh /path/to/repo --skills-only
#   ./install.sh /path/to/repo --no-ci
#
# From anywhere, without cloning first:
#   git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
#     && /tmp/csl/packs/routine-contract/install.sh "$PWD"
#
# Idempotent. Re-running upgrades the skill, the script and the CI check without
# touching routines.config.json — that file is yours once it exists.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-}"
shift || true
DRY=0; SKILLS_ONLY=0; NO_CI=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --skills-only) SKILLS_ONLY=1 ;;
    --no-ci) NO_CI=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "usage: install.sh <path-to-repo> [--dry-run] [--skills-only] [--no-ci]" >&2
  exit 2
fi
TARGET="$(cd "$TARGET" && pwd)"

say() { printf '%s\n' "$*"; }
run() { if [ $DRY -eq 1 ]; then say "  would: $*"; else "$@"; fi; }

say "routine-contract → $TARGET"
[ $DRY -eq 1 ] && say "(dry run — nothing will be written)"

# ---------------------------------------------------------------- skill
DEST_SKILLS="$TARGET/.claude/skills"
run mkdir -p "$DEST_SKILLS"
for src in "$PACK_DIR"/skills/*/; do
  name="$(basename "$src")"
  if [ -d "$DEST_SKILLS/$name" ]; then
    # Never delete a skill already here — an existing copy may be a fork with
    # local-only files. Set it aside instead.
    say "  update $name (previous copy → .claude/skills/.replaced/$name)"
    run mkdir -p "$DEST_SKILLS/.replaced"
    run rm -rf "$DEST_SKILLS/.replaced/$name"
    run mv "$DEST_SKILLS/$name" "$DEST_SKILLS/.replaced/$name"
  else
    say "  add    $name"
  fi
  run cp -R "$src" "$DEST_SKILLS/$name"
done

if [ $SKILLS_ONLY -eq 1 ]; then
  say "done (skill only — without scripts/ops/routine-digest.mjs nothing can emit a digest)"
  exit 0
fi

# ---------------------------------------------------------------- primitive
# scripts/ops/ matches the path the skill and the snippet both name. The script
# resolves the repo root through git, so another location works — but then the
# documented command line is wrong, so change both or neither.
say "  script scripts/ops/routine-digest.mjs"
run mkdir -p "$TARGET/scripts/ops"
run cp "$PACK_DIR/scripts/routine-digest.mjs" "$TARGET/scripts/ops/routine-digest.mjs"
run chmod +x "$TARGET/scripts/ops/routine-digest.mjs"

# ---------------------------------------------------------------- CI
if [ $NO_CI -eq 0 ]; then
  say "  ci     .claude/ci/routine-drift-check.mjs + .github/workflows/routine-contract.yml"
  run mkdir -p "$TARGET/.claude/ci" "$TARGET/.github/workflows"
  run cp "$PACK_DIR/ci/routine-drift-check.mjs" "$TARGET/.claude/ci/"
  run cp "$PACK_DIR/ci/routine-contract.yml" "$TARGET/.github/workflows/"

  # Seed the config only if absent. The drift check exits 2 without it, which is
  # correct — a fleet nobody has described cannot be checked — but a repo that
  # installs the pack and immediately goes red learns nothing, so seed an empty
  # list the operator fills in.
  CFG="$TARGET/routines.config.json"
  if [ -f "$CFG" ]; then
    say "  keep   routines.config.json (already present — not overwritten)"
  elif [ $DRY -eq 1 ]; then
    say "  would: seed routines.config.json with an empty routines list"
  else
    cat >"$CFG" <<'JSON'
{
  "$comment": "One entry per scheduled routine. maxAgeHours = its cadence plus a grace margin (30 for a daily, ~192 for a weekly). startsAfter (YYYY-MM-DD) suppresses a routine until the contract is live for it. Checked by .claude/ci/routine-drift-check.mjs.",
  "routines": []
}
JSON
    say "  seed   routines.config.json (empty — add your routines)"
  fi
fi

# ---------------------------------------------------------------- gitignore
GI="$TARGET/.gitignore"
if [ $DRY -eq 1 ]; then
  say "  would: ensure .claude/skills/.replaced/ is gitignored"
elif [ -f "$GI" ] && grep -q '^\.claude/skills/\.replaced/' "$GI"; then
  :
else
  {
    echo ""
    echo "# routine-contract pack — superseded skill copies, not repo artifacts"
    echo ".claude/skills/.replaced/"
  } >>"$GI"
  say "  ignore .claude/skills/.replaced/"
fi

say ""
say "Installed. Verify with:"
say "  node $TARGET/scripts/ops/routine-digest.mjs selftest"
say "  node $TARGET/scripts/ops/routine-digest.mjs preflight --routine install-check"
say ""
say "Two steps the installer cannot do for you:"
say "  1. Paste packs/routine-contract/contract.snippet.md into the repo's CLAUDE.md"
say "     and AGENTS.md. A skill file is not loaded by a routine that was never told"
say "     to load it — the snippet is what reaches every unattended session."
say "  2. List your scheduled routines in routines.config.json, or the drift check"
say "     has nothing to check and will exit 2."
