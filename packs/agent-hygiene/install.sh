#!/usr/bin/env bash
# install.sh — install the agent-hygiene pack into a repo.
#
#   ./install.sh /path/to/repo              # skill + Stop hook + linter + CI workflow
#   ./install.sh /path/to/repo --dry-run    # show what would change
#   ./install.sh /path/to/repo --skills-only
#   ./install.sh /path/to/repo --no-ci      # skip the linter and workflow
#
# From anywhere, without cloning first:
#   git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
#     && /tmp/csl/packs/agent-hygiene/install.sh "$PWD"
#
# Idempotent. The skill is copied from free-skills/ (the canonical copy; this
# pack carries no second one). A local copy that differs is set aside to
# .claude/skills/.replaced/<name>/ and named, never deleted. The hook is merged
# into .claude/settings.json by script name, so a re-run upgrades it in place
# and never adds a second entry. The workflow is written only when absent:
# workflows are repo policy and repos tune them.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "$PACK_DIR/../.." && pwd)"
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

say "agent-hygiene → $TARGET"
[ $DRY -eq 1 ] && say "(dry run — nothing will be written)"

# ---------------------------------------------------------------- skills
DEST_SKILLS="$TARGET/.claude/skills"
run mkdir -p "$DEST_SKILLS"
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
    say "  DIVERGED $name — local copy differs from canon; preserved at .claude/skills/.replaced/$name"
    run mkdir -p "$DEST_SKILLS/.replaced"
    run rm -rf "$DEST_SKILLS/.replaced/$name"
    run mv "$DEST_SKILLS/$name" "$DEST_SKILLS/.replaced/$name"
  else
    say "  add    $name"
  fi
  run cp -R "$src" "$DEST_SKILLS/$name"
done <"$PACK_DIR/manifest.txt"

if [ $SKILLS_ONLY -eq 1 ]; then
  say "done (skills only — no hook, so nothing asks for the verification line)"
  exit 0
fi

# ----------------------------------------------------------------- hook
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
  say "  would: merge the Stop hook into .claude/settings.json (existing hooks preserved)"
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
SCRIPT = re.compile(r"\.claude/hooks/(agent-hygiene-[a-z]+\.py)")


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

# ------------------------------------------------------ CI (between sessions)
if [ $NO_CI -eq 0 ]; then
  say "  ci     .claude/ci/agent-lint.py"
  run mkdir -p "$TARGET/.claude/ci" "$TARGET/.github/workflows"
  run cp "$PACK_DIR/ci/agent-lint.py" "$TARGET/.claude/ci/"
  run chmod +x "$TARGET/.claude/ci/agent-lint.py"
  WF="$TARGET/.github/workflows/agent-hygiene.yml"
  if [ ! -f "$WF" ]; then
    say "  ci     .github/workflows/agent-hygiene.yml"
    run cp "$PACK_DIR/ci/agent-hygiene.yml" "$WF"
  elif ! cmp -s "$WF" "$PACK_DIR/ci/agent-hygiene.yml"; then
    say "  keep   .github/workflows/agent-hygiene.yml (differs from the pack's; compare with $PACK_DIR/ci/agent-hygiene.yml)"
  fi
fi

# ---------------------------------------------------------------- gitignore
GI="$TARGET/.gitignore"
IGNORES=(.claude/skills/.replaced/)
if [ $DRY -eq 1 ]; then
  say "  would: ensure ${IGNORES[*]} are gitignored"
else
  missing=()
  for line in "${IGNORES[@]}"; do
    [ -f "$GI" ] && grep -qxF "$line" "$GI" || missing+=("$line")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    { echo ""; echo "# agent-hygiene pack — diverged copies set aside by install.sh"; printf '%s\n' "${missing[@]}"; } >>"$GI"
    say "  ignore ${missing[*]}"
  fi
fi

say ""
if [ $DRY -eq 1 ]; then
  say "Dry run complete — nothing was written."
  exit 0
fi
say "Installed. Verify with:"
say "  echo '{}' | python3 $TARGET/.claude/hooks/agent-hygiene-stop.py && echo hook-ok"
say "  python3 $TARGET/.claude/ci/agent-lint.py --all | tail -1"
say ""
say "Then add one line to the repo CLAUDE.md so the contract is in the prompt, not just the hook:"
say "  Agent, skill and command files meet the \`agent-hygiene\` bar: lint with \`python3 .claude/ci/agent-lint.py --changed\` before a PR and end every hand-back with a Verified: line. See .claude/skills/agent-hygiene/SKILL.md."
