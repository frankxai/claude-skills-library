#!/usr/bin/env bash
# install.sh — install the queen-ops pack into a repo.
#
#   ./install.sh /path/to/repo              # skill + hooks + settings merge
#   ./install.sh /path/to/repo --dry-run    # show what would change
#   ./install.sh /path/to/repo --skills-only
#
# From anywhere, without cloning first:
#   git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
#     && /tmp/csl/packs/queen-ops/install.sh "$PWD"
#
# Idempotent. Re-running upgrades the skill and re-merges the hooks without
# touching anything else in .claude/settings.json. The hooks stay inert until
# the repo is armed (.starlight/queen/active.json) — installing is not arming.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-}"
shift || true
DRY=0; SKILLS_ONLY=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --skills-only) SKILLS_ONLY=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "usage: install.sh <path-to-repo> [--dry-run] [--skills-only]" >&2
  exit 2
fi
TARGET="$(cd "$TARGET" && pwd)"

say() { printf '%s\n' "$*"; }
run() { if [ $DRY -eq 1 ]; then say "  would: $*"; else "$@"; fi; }

say "queen-ops → $TARGET"
[ $DRY -eq 1 ] && say "(dry run — nothing will be written)"

# ---------------------------------------------------------------- skills
DEST_SKILLS="$TARGET/.claude/skills"
run mkdir -p "$DEST_SKILLS"
for src in "$PACK_DIR"/skills/*/; do
  name="$(basename "$src")"
  if [ -d "$DEST_SKILLS/$name" ]; then
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
  say "done (skills only — hooks not installed, so nothing enforces the gates)"
  exit 0
fi

# ---------------------------------------------------------------- hooks
DEST_HOOKS="$TARGET/.claude/hooks"
run mkdir -p "$DEST_HOOKS"
for h in "$PACK_DIR"/hooks/*.py; do
  say "  hook   $(basename "$h")"
  run cp "$h" "$DEST_HOOKS/"
  run chmod +x "$DEST_HOOKS/$(basename "$h")"
done

# ---------------------------------------------------- settings.json merge
SETTINGS="$TARGET/.claude/settings.json"
if [ $DRY -eq 1 ]; then
  say "  would: merge hooks into .claude/settings.json (existing hooks preserved)"
else
  python3 - "$SETTINGS" "$PACK_DIR/settings.snippet.json" <<'PY'
import json, os, re, sys

settings_path, snippet_path = sys.argv[1], sys.argv[2]
snippet = json.load(open(snippet_path, encoding="utf-8"))["hooks"]

if os.path.exists(settings_path):
    try:
        settings = json.load(open(settings_path, encoding="utf-8"))
    except json.JSONDecodeError as exc:
        sys.exit(f"  !! {settings_path} is not valid JSON ({exc}) — fix it, then re-run")
else:
    settings = {}

hooks = settings.setdefault("hooks", {})
added = updated = removed = 0

# Ours by script name, so a re-run upgrades in place instead of adding a twin.
SCRIPT = re.compile(r"\.claude/hooks/(queen-ops-[a-z-]+\.py)")


def script_of(cmd):
    m = SCRIPT.search(cmd or "")
    return m.group(1) if m else None


ours = {script_of(h["command"]): h for entries in snippet.values() for e in entries for h in e["hooks"]}

for event, entries in snippet.items():
    existing = hooks.setdefault(event, [])
    seen = set()
    for e in existing:
        kept = []
        for h in e.get("hooks", []):
            key = script_of(h.get("command"))
            if key in ours:
                if key in seen:
                    removed += 1
                    continue
                seen.add(key)
                if h != ours[key]:
                    h = dict(ours[key])
                    updated += 1
            kept.append(h)
        e["hooks"] = kept
    hooks[event] = [e for e in existing if e.get("hooks")]
    for entry in entries:
        new = [h for h in entry["hooks"] if script_of(h.get("command")) not in seen]
        if not new:
            continue
        merged = dict(entry)
        merged["hooks"] = new
        hooks[event].append(merged)
        added += len(new)

os.makedirs(os.path.dirname(settings_path), exist_ok=True)
with open(settings_path, "w", encoding="utf-8") as fh:
    json.dump(settings, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print(f"  merge  .claude/settings.json ({added} added, {updated} upgraded, {removed} duplicates removed; other hooks untouched)")
PY
fi

# ---------------------------------------------------------------- gitignore
GI="$TARGET/.gitignore"
IGNORES=(.starlight/queen/ .claude/skills/.replaced/ '.claude/hooks/__pycache__/')
if [ $DRY -eq 1 ]; then
  say "  would: ensure ${IGNORES[*]} are gitignored"
else
  missing=()
  for line in "${IGNORES[@]}"; do
    [ -f "$GI" ] && grep -qxF "$line" "$GI" || missing+=("$line")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    if [ -f "$GI" ] && grep -qxF "# queen-ops pack — local briefs and receipts, not repo artifacts" "$GI"; then
      printf '%s\n' "${missing[@]}" >>"$GI"
    else
      { echo ""; echo "# queen-ops pack — local briefs and receipts, not repo artifacts"; printf '%s\n' "${missing[@]}"; } >>"$GI"
    fi
    say "  ignore ${missing[*]}"
  fi
fi

say ""
say "Installed (not armed). Verify with:"
say "  echo '{}' | python3 $TARGET/.claude/hooks/queen-ops-session.py"
say "Arm a Queen session when you mean it:"
say "  mkdir -p $TARGET/.starlight/queen && echo '{\"armedAt\":\"'\$(date -u +%FT%TZ)'\"}' > $TARGET/.starlight/queen/active.json"
say "Then one line in the repo CLAUDE.md: Multi-agent dispatch in this repo goes through the \`queen-ops\` skill; a Queen session is armed, not assumed."
