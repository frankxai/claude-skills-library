#!/usr/bin/env bash
# install.sh — install the stack-kits pack into a repo.
#
#   ./install.sh /path/to/repo               # detect stack, install kits + router
#   ./install.sh /path/to/repo --dry-run     # show what would change
#   ./install.sh /path/to/repo --kits tailwindcss,nextjs   # override detection
#   ./install.sh /path/to/repo --force-kits  # install a kit even where an
#                                            # equivalent skill already exists
#
# Idempotent. Re-running upgrades the kits, the router and the generated
# .claude/skills/stack-kits.rules.json, and re-merges one UserPromptSubmit hook
# without touching any other hook. Repo-specific routing lives in
# .claude/skills/stack-kits.local.json, and a repo's own skill-rules.json (ACOS
# schema) is read by the router but never written — this script writes neither.
#
# Deliberately unlike upstream's claude-setup: it never removes .claude/, never
# installs node_modules, and never adds hooks other than the router.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-}"
shift || true
DRY=0; FORCE=0; KITS_OVERRIDE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --force-kits) FORCE=1 ;;
    --kits) shift; KITS_OVERRIDE="${1:-}" ;;
    --kits=*) KITS_OVERRIDE="${1#--kits=}" ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
  shift
done

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "usage: install.sh <path-to-repo> [--dry-run] [--kits a,b] [--force-kits]" >&2
  exit 2
fi
command -v node >/dev/null || { echo "node 18+ is required" >&2; exit 2; }
TARGET="$(cd "$TARGET" && pwd)"

say() { printf '%s\n' "$*"; }
run() { if [ $DRY -eq 1 ]; then say "  would: $*"; else "$@"; fi; }

say "stack-kits → $TARGET"
[ $DRY -eq 1 ] && say "(dry run — nothing will be written)"

# ------------------------------------------------------------- detection
# Root package.json plus apps/*/package.json, so a Turborepo web app counts.
detect() {
  node - "$TARGET" <<'JS'
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const files = [path.join(root, 'package.json')];
const apps = path.join(root, 'apps');
if (fs.existsSync(apps)) for (const d of fs.readdirSync(apps)) files.push(path.join(apps, d, 'package.json'));
const deps = new Set();
for (const f of files) {
  try {
    const p = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const k of ['dependencies', 'devDependencies', 'peerDependencies']) Object.keys(p[k] || {}).forEach((d) => deps.add(d));
  } catch {}
}
const kits = [];
if (deps.has('next')) kits.push('nextjs');
if (deps.has('react')) kits.push('react');
if (deps.has('tailwindcss') || deps.has('@tailwindcss/postcss') || deps.has('@tailwindcss/vite')) kits.push('tailwindcss');
const hasComponentsJson = [root, ...fs.existsSync(apps) ? fs.readdirSync(apps).map((d) => path.join(apps, d)) : []]
  .some((d) => { try { return /shadcn/.test(fs.readFileSync(path.join(d, 'components.json'), 'utf8')); } catch { return false; } });
if (hasComponentsJson) kits.push('shadcn');
process.stdout.write(kits.join(','));
JS
}

if [ -n "$KITS_OVERRIDE" ]; then KITS="$KITS_OVERRIDE"; else KITS="$(detect)"; fi
say "  stack  ${KITS:-none detected}"
[ -z "$KITS" ] && { say "nothing to install"; exit 0; }

# --------------------------------------------------------------- kits
DEST_SKILLS="$TARGET/.claude/skills"
run mkdir -p "$DEST_SKILLS"
INSTALLED=""; ALIASES="{}"
equivalent_for() {
  node -e '
    const e = require(process.argv[1]).equivalents || {};
    const fs = require("fs"), path = require("path");
    for (const s of e[process.argv[2]] || []) {
      if (fs.existsSync(path.join(process.argv[3], s, "SKILL.md"))) { process.stdout.write(s); break; }
    }' "$PACK_DIR/rules/estate.json" "$1" "$DEST_SKILLS"
}
add_alias() {
  ALIASES="$(node -e 'const a=JSON.parse(process.argv[1]); a[process.argv[2]]=process.argv[3]; process.stdout.write(JSON.stringify(a))' "$ALIASES" "$1" "$2")"
}

IFS=',' read -ra KIT_LIST <<<"$KITS"
for kit in "${KIT_LIST[@]}"; do
  [ -d "$PACK_DIR/skills/$kit" ] || { say "  skip   $kit (no such kit in this pack)"; continue; }
  eq=""
  [ $FORCE -eq 0 ] && eq="$(equivalent_for "$kit")"
  if [ -n "$eq" ]; then
    say "  route  $kit → existing $eq (kit not copied; --force-kits to copy)"
    add_alias "$kit" "$eq"
  else
    if [ -d "$DEST_SKILLS/$kit" ] && diff -rq "$DEST_SKILLS/$kit" "$PACK_DIR/skills/$kit" >/dev/null 2>&1; then
      say "  keep   $kit (already current)"
    else
      if [ -d "$DEST_SKILLS/$kit" ]; then
        # Never delete a skill that is already here — it may carry local edits.
        say "  update $kit (previous copy → .claude/skills/.replaced/$kit)"
        run mkdir -p "$DEST_SKILLS/.replaced"
        run rm -rf "$DEST_SKILLS/.replaced/$kit"
        run mv "$DEST_SKILLS/$kit" "$DEST_SKILLS/.replaced/$kit"
      else
        say "  add    $kit"
      fi
      run cp -R "$PACK_DIR/skills/$kit" "$DEST_SKILLS/$kit"
    fi
  fi
  INSTALLED="${INSTALLED:+$INSTALLED,}$kit"
done

# ------------------------------------------------------------- router
DEST_HOOKS="$TARGET/.claude/hooks"
run mkdir -p "$DEST_HOOKS"
say "  hook   skill-activation-prompt.mjs"
run cp "$PACK_DIR/hooks/skill-activation-prompt.mjs" "$DEST_HOOKS/"

# ------------------------------------------------------------- rules
if [ $DRY -eq 1 ]; then
  say "  would: compose .claude/skills/stack-kits.rules.json from kits [$INSTALLED] aliases $ALIASES"
else
  node "$PACK_DIR/lib/compose.mjs" "$TARGET" "$INSTALLED" "$ALIASES"
fi

# ---------------------------------------------------- settings.json merge
SETTINGS="$TARGET/.claude/settings.json"
if [ $DRY -eq 1 ]; then
  say "  would: merge one UserPromptSubmit hook into .claude/settings.json (others preserved)"
else
  python3 - "$SETTINGS" <<'PY'
import json, os, sys
path = sys.argv[1]
ours = {"type": "command", "command": "node .claude/hooks/skill-activation-prompt.mjs", "timeout": 5}
if os.path.exists(path):
    try:
        settings = json.load(open(path, encoding="utf-8"))
    except json.JSONDecodeError as exc:
        sys.exit(f"  !! {path} is not valid JSON ({exc}) — fix it, then re-run")
else:
    settings = {}
entries = settings.setdefault("hooks", {}).setdefault("UserPromptSubmit", [])
state = "added"
for e in entries:
    for i, h in enumerate(e.get("hooks", [])):
        if h.get("command") == ours["command"]:
            state = "unchanged" if h == ours else "upgraded"
            e["hooks"][i] = dict(ours)
if state == "added":
    entries.append({"hooks": [dict(ours)]})
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w", encoding="utf-8") as fh:
    json.dump(settings, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print(f"  merge  .claude/settings.json (router {state}; other hooks untouched)")
PY
fi

GI="$TARGET/.gitignore"
if [ $DRY -eq 0 ] && { [ ! -f "$GI" ] || ! grep -q '^\.claude/skills/\.replaced/' "$GI"; }; then
  printf '\n# stack-kits / web-excellence — skills set aside on upgrade\n.claude/skills/.replaced/\n' >>"$GI"
fi

# A repo that whitelists .claude/ entries in .gitignore (".claude/skills/*/"
# then "!.claude/skills/<name>/") would silently drop everything above from the
# commit. Say exactly which lines are missing rather than editing its policy.
if [ $DRY -eq 0 ] && git -C "$TARGET" rev-parse --git-dir >/dev/null 2>&1; then
  ignored=""
  for p in .claude/hooks/skill-activation-prompt.mjs .claude/skills/stack-kits.rules.json; do
    git -C "$TARGET" check-ignore -q "$p" && ignored="$ignored $p"
  done
  for kit in "${KIT_LIST[@]}"; do
    [ -f "$DEST_SKILLS/$kit/SKILL.md" ] && git -C "$TARGET" check-ignore -q ".claude/skills/$kit/SKILL.md" && ignored="$ignored .claude/skills/$kit/"
  done
  if [ -n "$ignored" ]; then
    say ""
    say "  !! .gitignore hides installed files; add these lines to it to commit them:"
    for p in $ignored; do say "       !$p"; done
  fi
fi

say ""
say "Installed. Verify with:"
say "  echo '{\"prompt\":\"redesign the hero for mobile\"}' | CLAUDE_PROJECT_DIR=$TARGET node $TARGET/.claude/hooks/skill-activation-prompt.mjs"
