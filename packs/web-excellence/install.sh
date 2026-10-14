#!/usr/bin/env bash
# install.sh — install the web-excellence pack into a repo.
#
#   ./install.sh /path/to/repo              # skills + hooks + settings merge
#   ./install.sh /path/to/repo --dry-run    # show what would change
#   ./install.sh /path/to/repo --skills-only
#   ./install.sh /path/to/repo --no-db      # skip ui-ux-pro-max (~1.8 MB of CSV)
#
# From anywhere, without cloning first:
#   git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
#     && /tmp/csl/packs/web-excellence/install.sh "$PWD"
#
# Idempotent. Re-running upgrades the skills and re-merges the hooks without
# touching anything else in .claude/settings.json.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-}"
shift || true
DRY=0; SKILLS_ONLY=0; NO_DB=0; NO_CI=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --skills-only) SKILLS_ONLY=1 ;;
    --no-db) NO_DB=1 ;;
    --no-ci) NO_CI=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "usage: install.sh <path-to-repo> [--dry-run] [--skills-only] [--no-db] [--no-ci]" >&2
  exit 2
fi
TARGET="$(cd "$TARGET" && pwd)"

say() { printf '%s\n' "$*"; }
run() { if [ $DRY -eq 1 ]; then say "  would: $*"; else "$@"; fi; }

say "web-excellence → $TARGET"
[ $DRY -eq 1 ] && say "(dry run — nothing will be written)"

# ---------------------------------------------------------------- skills
DEST_SKILLS="$TARGET/.claude/skills"
run mkdir -p "$DEST_SKILLS"
for src in "$PACK_DIR"/skills/*/; do
  name="$(basename "$src")"
  if [ $NO_DB -eq 1 ] && [ "$name" = "ui-ux-pro-max" ]; then
    say "  skip   $name (--no-db)"
    continue
  fi
  if [ -d "$DEST_SKILLS/$name" ]; then
    # Never delete a skill that is already here — an existing copy may be an
    # older fork carrying local-only files. Set it aside instead.
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
  say "done (skills only — hooks not installed, so nothing enforces the gate)"
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

# Ours by script name, not by command string. Re-running must UPGRADE these in
# place (a changed timeout, a new command form) rather than add a second copy
# next to the old one — otherwise the pack can never ship a fix to an
# installed repo, and a changed command would run every hook twice.
SCRIPT = re.compile(r"\.claude/hooks/(web-excellence-[a-z]+\.py)")


def script_of(cmd):
    m = SCRIPT.search(cmd or "")
    return m.group(1) if m else None


ours = {script_of(h["command"]): h for entries in snippet.values() for e in entries for h in e["hooks"]}

for event, entries in snippet.items():
    existing = hooks.setdefault(event, [])
    seen = set()
    for e in existing:
        before = e.get("hooks", [])
        kept = []
        for h in before:
            key = script_of(h.get("command"))
            if key in ours:
                if key in seen:
                    removed += 1  # a second copy left by an older install
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
# The hooks cover a session. This covers every PR, whoever opened it.
if [ $NO_CI -eq 0 ]; then
  say "  ci     .claude/ci/web-guidelines-lint.mjs"
  run mkdir -p "$TARGET/.claude/ci" "$TARGET/.github/workflows"
  run cp "$PACK_DIR/ci/web-guidelines-lint.mjs" "$TARGET/.claude/ci/"
  # A workflow is repo policy (action pins, draft gating, triggers), and repos
  # tune it after install. Write it only when absent; never overwrite a copy
  # that differs, say so instead.
  WF="$TARGET/.github/workflows/web-excellence.yml"
  if [ ! -f "$WF" ]; then
    say "  ci     .github/workflows/web-excellence.yml"
    run cp "$PACK_DIR/ci/web-excellence.yml" "$WF"
  elif ! cmp -s "$WF" "$PACK_DIR/ci/web-excellence.yml"; then
    say "  keep   .github/workflows/web-excellence.yml (differs from the pack's; compare with $PACK_DIR/ci/web-excellence.yml)"
  fi
fi

# ---------------------------------------------------------------- gitignore
# Line by line, so a repo installed by an older version picks up new entries.
GI="$TARGET/.gitignore"
IGNORES=(.visual-proof/ .lighthouse.json .extract-design-system/ .claude/skills/.replaced/ '.claude/skills/**/__pycache__/')
if [ $DRY -eq 1 ]; then
  say "  would: ensure ${IGNORES[*]} are gitignored"
else
  missing=()
  for line in "${IGNORES[@]}"; do
    [ -f "$GI" ] && grep -qxF "$line" "$GI" || missing+=("$line")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    if [ -f "$GI" ] && grep -qxF "# web-excellence pack — local evidence, not repo artifacts" "$GI"; then
      printf '%s\n' "${missing[@]}" >>"$GI"
    else
      { echo ""; echo "# web-excellence pack — local evidence, not repo artifacts"; printf '%s\n' "${missing[@]}"; } >>"$GI"
    fi
    say "  ignore ${missing[*]}"
  fi
fi

say ""
say "Installed. Verify with:"
say "  python3 -c \"import json;d=json.load(open('$TARGET/.claude/settings.json'));print(list(d['hooks']))\""
say "  echo '{}' | python3 $TARGET/.claude/hooks/web-excellence-session.py"
say ""
say "Then add one line to the repo CLAUDE.md so the contract is in the prompt, not just the hook:"
say "  Website / web-design work goes through the \`web-release-gate\` skill first. See .claude/skills/web-release-gate/SKILL.md."
