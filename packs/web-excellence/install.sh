#!/usr/bin/env bash
# install.sh — install the web-excellence pack into a repo.
#
#   ./install.sh /path/to/repo              # skills + hooks + settings merge
#   ./install.sh /path/to/repo --dry-run    # show what would change
#   ./install.sh /path/to/repo --skills-only
#   ./install.sh /path/to/repo --no-agents   # skip the three web workers
#   ./install.sh /path/to/repo --no-db      # skip ui-ux-pro-max (~1.8 MB of CSV)
#   ./install.sh /path/to/repo --claude-md  # also write the gate block into CLAUDE.md / AGENTS.md
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
DRY=0; SKILLS_ONLY=0; NO_DB=0; NO_CI=0; NO_AGENTS=0; CLAUDE_MD=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --skills-only) SKILLS_ONLY=1 ;;
    --no-db) NO_DB=1 ;;
    --no-ci) NO_CI=1 ;;
    --no-agents) NO_AGENTS=1 ;;
    --claude-md) CLAUDE_MD=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "usage: install.sh <path-to-repo> [--dry-run] [--skills-only] [--no-db] [--no-ci] [--no-agents] [--claude-md]" >&2
  exit 2
fi
TARGET="$(cd "$TARGET" && pwd)"

say() { printf '%s\n' "$*"; }
run() { if [ $DRY -eq 1 ]; then say "  would: $*"; else "$@"; fi; }

# A file the repo's .gitignore hides is installed locally but never committed,
# so it never reaches a cloud session. Repos that allowlist pack skills one by
# one (`.claude/skills/*/` then `!.claude/skills/<name>/`) hit this on every new
# skill; say so instead of letting it go missing.
warn_ignored() {
  [ $DRY -eq 1 ] && return 0
  git -C "$TARGET" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0
  if git -C "$TARGET" check-ignore -q "$1"; then
    say "  !! $1 is gitignored here, so it will not reach cloud sessions; allow it with: !$2"
  fi
}

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
    # An installed copy identical to the pack's is already canonical: leave
    # it and create no set-aside, or every re-run would mint one. Python's
    # bytecode cache under ui-ux-pro-max is not a difference.
    # A symlink is never canonical, whatever it points at, whether the skill
    # directory itself or any file inside it: the install must be a
    # self-contained copy, so it falls through to the set-aside below.
    if [ ! -L "${DEST_SKILLS%/}/$name" ] \
       && [ -z "$(find "$DEST_SKILLS/$name" -type l -print -quit)" ] \
       && diff -rq -x __pycache__ "$src" "$DEST_SKILLS/$name" >/dev/null 2>&1; then
      say "  ok     $name (already canonical)"
      continue
    fi
    # Never delete a skill that is already here — an existing copy may be an
    # older fork carrying local-only files. Set it aside instead.
    say "  update $name (previous copy → .claude/skills/.replaced/$name.<timestamp>)"
    run mkdir -p "$DEST_SKILLS/.replaced"
    # Versioned set-aside: never overwrite an earlier set-aside copy, so a
    # customised skill survives any number of re-runs.
    aside="$DEST_SKILLS/.replaced/$name.$(date -u +%Y%m%dT%H%M%SZ)"
    n=0; while [ -e "$aside" ]; do n=$((n+1)); aside="$DEST_SKILLS/.replaced/$name.$(date -u +%Y%m%dT%H%M%SZ).$n"; done
    run mv "$DEST_SKILLS/$name" "$aside"
  else
    say "  add    $name"
  fi
  run cp -R "$src" "$DEST_SKILLS/$name"
  warn_ignored ".claude/skills/$name/SKILL.md" ".claude/skills/$name/"
done

# ---------------------------------------------------------------- agents
# Compiled in agentic-creator-os and vendored here (see SOURCES.md). A local
# copy that differs is set aside outside .claude/agents/, because the harness
# loads agent files from subdirectories there too and would see two agents
# with one name.
if [ $NO_AGENTS -eq 0 ] && [ $SKILLS_ONLY -eq 0 ] && [ -d "$PACK_DIR/agents" ]; then
  DEST_AGENTS="$TARGET/.claude/agents"
  run mkdir -p "$DEST_AGENTS"
  for src in "$PACK_DIR"/agents/*.md; do
    name="$(basename "$src")"
    dest="$DEST_AGENTS/$name"
    # As with skills, a symlink is never canonical, and it is moved aside
    # rather than written through.
    if [ ! -L "$dest" ] && [ -f "$dest" ] && cmp -s "$src" "$dest"; then
      say "  ok     agent ${name%.md}"
      continue
    fi
    if [ -e "$dest" ] || [ -L "$dest" ]; then
      say "  update agent ${name%.md} (previous copy → .claude/agents.replaced/${name%.md}.<timestamp>.md)"
      run mkdir -p "$TARGET/.claude/agents.replaced"
      # Versioned like the skills set-aside, so a second re-run keeps the first copy.
      aside="$TARGET/.claude/agents.replaced/${name%.md}.$(date -u +%Y%m%dT%H%M%SZ).md"
      n=0; while [ -e "$aside" ] || [ -L "$aside" ]; do n=$((n+1)); aside="$TARGET/.claude/agents.replaced/${name%.md}.$(date -u +%Y%m%dT%H%M%SZ).$n.md"; done
      run mv "$dest" "$aside"
    else
      say "  add    agent ${name%.md}"
    fi
    run cp "$src" "$dest"
    warn_ignored ".claude/agents/$name" ".claude/agents/$name"
  done
fi

# ------------------------------------------------- CLAUDE.md / AGENTS.md
# The prompt is where a session first learns the gate exists, and where a
# harness that never loads .claude/skills (Codex, Grok) reads it from. Opt-in:
# these files are repo contracts. Writes one fenced block, replaced in place on
# a re-run, and never touches a hand-written web design gate section.
if [ $CLAUDE_MD -eq 1 ]; then
  python3 - "$TARGET" "$PACK_DIR/claude-md.snippet.md" "$DRY" <<'PY'
import os, re, sys

target, snippet_path, dry = sys.argv[1], sys.argv[2], sys.argv[3] == "1"
BEGIN, END = "<!-- web-excellence:begin -->", "<!-- web-excellence:end -->"
body = open(snippet_path, encoding="utf-8").read().strip("\n")
block = f"{BEGIN}\n{body}\n{END}"
names = [n for n in ("CLAUDE.md", "AGENTS.md") if os.path.lexists(os.path.join(target, n))] or ["CLAUDE.md"]

for name in names:
    path = os.path.join(target, name)
    if os.path.islink(path):
        print(f"  keep   {name} (a symlink is never written through)")
        continue
    text = ""
    if os.path.isfile(path):
        with open(path, encoding="utf-8", newline="") as fh:
            text = fh.read()
    eol = "\r\n" if "\r\n" in text else "\n"
    fenced = block.replace("\n", eol)
    if BEGIN in text and END in text:
        head, rest = text.split(BEGIN, 1)
        _, tail = rest.split(END, 1)
        new, status = head + fenced + tail, "update"
        if new == text:
            print(f"  ok     {name} (gate block is current)")
            continue
    elif re.search(r"web design gate", text, re.I):
        note = "" if "gpu-surface" in text else "; it does not name gpu-surface, so add the second paragraph of claude-md.snippet.md"
        print(f"  keep   {name} (has its own web design gate section{note})")
        continue
    else:
        gap = "" if not text else (eol if text.endswith(eol * 2) else (eol if text.endswith(eol) else eol * 2))
        new, status = text + gap + fenced + eol, "add"
    if dry:
        print(f"  would: {status} the gate block in {name}")
        continue
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(new)
    print(f"  {status:<6} {name} (gate block)")
PY
fi

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
IGNORES=(.visual-proof/ .gpu-export/ .lighthouse.json .extract-design-system/ .claude/skills/.replaced/ '.claude/skills/**/__pycache__/' .claude/agents.replaced/)
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
if [ $CLAUDE_MD -eq 0 ]; then
  say "Then put the contract in the prompt, not just the hook. Re-run with --claude-md to write"
  say "the block into CLAUDE.md / AGENTS.md, or paste $PACK_DIR/claude-md.snippet.md by hand."
fi
