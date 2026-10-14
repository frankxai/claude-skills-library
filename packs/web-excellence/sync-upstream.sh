#!/usr/bin/env bash
# sync-upstream.sh — re-vendor the third-party skills in this pack from their
# upstream repos and rewrite the pin table in SOURCES.md.
#
# Every skill under skills/ that is NOT listed in NATIVE below is a verbatim
# copy of an upstream directory. This script is the only supported way to
# update them: it clones each upstream at HEAD, copies the skill directory in,
# and records the exact commit it came from. Never hand-edit a vendored skill —
# the next sync overwrites it. Local behavior belongs in the native skills or
# in the hooks.
#
#   ./sync-upstream.sh            # sync all
#   ./sync-upstream.sh --check    # report drift, change nothing (CI-safe)
#
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$PACK_DIR/skills"
# mktemp, not "$TMPDIR/name.$$" — the PID space is small enough to pre-enumerate,
# so a predictable name in a world-writable dir can be pre-created as a symlink to
# somewhere a local co-tenant owns, and `mkdir -p` would happily accept it. The
# clones would then land in their directory and the vendored result — which
# includes ui-ux-pro-max's Python and every SKILL.md an agent later reads as
# instructions — is what install.sh fans out to every repo. mktemp -d fails
# instead of reusing, and creates 0700, which also closes the window where a
# second entry's copy could read a tree mutated after the first copy.
WORK="$(mktemp -d "${TMPDIR:-/tmp}/web-excellence-sync.XXXXXXXX")"
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

# Skills authored here, never overwritten by a sync.
NATIVE="web-release-gate core-web-vitals visual-proof"

# repo | license | source path in repo | destination skill dir
UPSTREAM=(
  "vercel-labs/agent-skills|MIT|skills/web-design-guidelines|web-design-guidelines"
  "emilkowalski/skills|MIT|skills/review-animations|review-animations"
  "emilkowalski/skills|MIT|skills/improve-animations|improve-animations"
  "emilkowalski/skills|MIT|skills/find-animation-opportunities|find-animation-opportunities"
  "emilkowalski/skills|MIT|skills/emil-design-eng|emil-design-eng"
  "emilkowalski/skills|MIT|skills/apple-design|apple-design"
  "emilkowalski/skills|MIT|skills/animation-vocabulary|animation-vocabulary"
  "nextlevelbuilder/ui-ux-pro-max-skill|MIT|.claude/skills/ui-ux-pro-max|ui-ux-pro-max"
  "arvindrk/extract-design-system|MIT|skills/extract-design-system|extract-design-system"
  "Leonxlnx/taste-skill|MIT|skills/image-to-code-skill|image-to-code"
  "Leonxlnx/taste-skill|MIT|skills/brandkit|brandkit"
)

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

declare -A SHAS
drift=0

for entry in "${UPSTREAM[@]}"; do
  IFS='|' read -r repo license src dest <<<"$entry"
  slug="${repo//\//_}"
  if [ ! -d "$WORK/$slug" ]; then
    echo "→ cloning $repo"
    git clone --depth 1 -q "https://github.com/$repo.git" "$WORK/$slug"
    SHAS["$repo"]="$(git -C "$WORK/$slug" rev-parse HEAD)"
  fi

  if [ ! -d "$WORK/$slug/$src" ]; then
    echo "!! $repo: upstream path '$src' no longer exists — upstream restructured, fix UPSTREAM[] above" >&2
    exit 1
  fi

  if [ $CHECK_ONLY -eq 1 ]; then
    # UPSTREAM-LICENSE is written by this script, not by upstream, so it must
    # not count as drift — otherwise every licensed skill reports DRIFT forever.
    if ! diff -rq --exclude=UPSTREAM-LICENSE "$WORK/$slug/$src" "$SKILLS_DIR/$dest" >/dev/null 2>&1; then
      echo "DRIFT  $dest  (upstream $repo @ ${SHAS[$repo]:0:8})"
      drift=1
    else
      echo "ok     $dest"
    fi
    continue
  fi

  echo "→ vendoring $dest from $repo/$src"
  rm -rf "${SKILLS_DIR:?}/$dest"
  mkdir -p "$SKILLS_DIR/$dest"
  cp -R "$WORK/$slug/$src/." "$SKILLS_DIR/$dest/"
  # upstream LICENSE travels with the skill so attribution survives a copy
  found_lic=0
  for lic in LICENSE LICENSE.md LICENSE.txt LICENCE LICENCE.md license.md; do
    if [ -f "$WORK/$slug/$lic" ]; then
      cp "$WORK/$slug/$lic" "$SKILLS_DIR/$dest/UPSTREAM-LICENSE"; found_lic=1; break
    fi
  done
  # Some upstreams ship no LICENSE file and declare the licence only in their
  # README (vercel-labs/agent-skills does this). Record that declaration, with
  # the commit, so the vendored copy still carries its provenance. Refuse the
  # vendor outright if even that is missing — ABSORPTION.md gate 1.
  if [ $found_lic -eq 0 ]; then
    section="$(awk '/^##+[[:space:]]+[Ll]icen[cs]e/{f=1; next} /^##+[[:space:]]/{if(f) exit} f' "$WORK/$slug/README.md" 2>/dev/null | sed '/^[[:space:]]*$/d')"
    if [ -z "$section" ]; then
      echo "!! $repo ships no LICENSE file and its README has no License section — refusing to vendor $dest (ABSORPTION.md gate 1)" >&2
      exit 1
    fi
    {
      echo "UPSTREAM LICENCE RECORD — written by sync-upstream.sh, do not hand-edit"
      echo
      echo "Upstream: https://github.com/$repo"
      echo "Commit:   ${SHAS[$repo]}"
      echo "Path:     $src"
      echo
      echo "The upstream repository ships no LICENSE file at this commit. Its README.md"
      echo "declares the licence under a 'License' heading. That declaration, verbatim:"
      echo
      printf '%s\n' "$section" | sed 's/^/    /'
      echo
      echo "Declared licence as recorded in SOURCES.md: $license."
      echo "Licence text: https://spdx.org/licenses/$license.html"
    } > "$SKILLS_DIR/$dest/UPSTREAM-LICENSE"
  fi
done

if [ $CHECK_ONLY -eq 1 ]; then
  echo
  [ $drift -eq 0 ] && echo "No drift. Vendored skills match upstream HEAD." || echo "Drift found — run ./sync-upstream.sh to update."
  exit $drift
fi

# ---- rewrite the pin table in SOURCES.md between the markers ----
PINS="$WORK/pins.md"
{
  echo "<!-- PINS:BEGIN — generated by sync-upstream.sh, do not hand-edit -->"
  echo
  echo "| Skill | Upstream | License | Pinned commit | Synced |"
  echo "|---|---|---|---|---|"
  for entry in "${UPSTREAM[@]}"; do
    IFS='|' read -r repo license src dest <<<"$entry"
    sha="${SHAS[$repo]}"
    echo "| \`$dest\` | [$repo](https://github.com/$repo) \`$src\` | $license | \`${sha:0:12}\` | $(date -u +%Y-%m-%d) |"
  done
  echo
  echo "Native to this pack (not vendored): $(for n in $NATIVE; do printf '`%s` ' "$n"; done)"
  echo
  echo "<!-- PINS:END -->"
} >"$PINS"

python3 - "$PACK_DIR/SOURCES.md" "$PINS" <<'PY'
import re, sys
target, pins = sys.argv[1], sys.argv[2]
doc = open(target, encoding="utf-8").read()
block = open(pins, encoding="utf-8").read().strip()
new = re.sub(r"<!-- PINS:BEGIN.*?PINS:END -->", block, doc, flags=re.S)
open(target, "w", encoding="utf-8").write(new)
PY

echo
echo "Done. Review 'git diff packs/web-excellence' before committing."
