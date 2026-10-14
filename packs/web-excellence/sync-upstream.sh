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
# Licensing is checked before anything under skills/ is touched: every entry's
# declared licence must be on the ABSORPTION.md allowlist, and the upstream's
# LICENSE file (or, failing that, the License section of its README) must read
# as that licence. One refusal aborts the whole run with the tree unchanged.
#
# Test hooks (tests/test_sync_upstream.py): WEB_EXCELLENCE_UPSTREAM_BASE replaces
# https://github.com as the clone prefix; WEB_EXCELLENCE_UPSTREAM_FILE replaces
# the UPSTREAM list below with the lines of that file, same format.
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
if [ -n "${WEB_EXCELLENCE_UPSTREAM_FILE:-}" ]; then
  mapfile -t UPSTREAM < <(grep -v '^[[:space:]]*\(#\|$\)' "$WEB_EXCELLENCE_UPSTREAM_FILE")
fi
UPSTREAM_BASE="${WEB_EXCELLENCE_UPSTREAM_BASE:-https://github.com}"

# ABSORPTION.md gate 1. Key: the licence SOURCES.md may declare. Value: what the
# upstream's LICENSE file, or its README declaration, must contain to count as
# that licence. Word-bounded so "LIMITED" in a GPL text never reads as MIT.
declare -A ALLOWED=(
  [MIT]='(^|[^[:alnum:]])MIT([^[:alnum:]]|$)'
  [Apache-2.0]='Apache License|Apache-2\.0'
  [BSD-2-Clause]='BSD[- ]2|2-Clause|Simplified BSD|Redistributions of source code must retain'
  [BSD-3-Clause]='BSD[- ]3|3-Clause|Neither the name of'
  [ISC]='(^|[^[:alnum:]])ISC([^[:alnum:]]|$)|Permission to use, copy, modify, and/or distribute'
  [CC0-1.0]='CC0|Creative Commons Zero'
  [CC-BY-4.0]='CC-BY-4\.0|CC BY 4\.0|Attribution 4\.0 International'
  [Unlicense]='Unlicense|This is free and unencumbered software'
)
# The two BSD variants share their first two clauses, so each is also refused
# when the text carries the other's marker: the third clause names it.
declare -A EXCLUDES=(
  [BSD-2-Clause]='BSD[- ]3|3-Clause|Neither the name of'
  [BSD-3-Clause]='BSD[- ]2|2-Clause|Simplified BSD'
)
# Refused whatever SOURCES.md says: copyleft reaches this library's MIT root
# and -NC conflicts with commercial shipping. The -NC form is the SPDX suffix
# only (CC-BY-NC-4.0), as in ABSORPTION.md; a bare "NC" is somebody's initials.
REFUSED='GNU (General|Lesser|Affero) (General )?Public License|GPL|NonCommercial|-NC([^[:alnum:]]|$)'
# "All rights reserved" is refused too, with one carve-out: the BSD and many
# MIT LICENSE files open with it in the copyright line above the grant. So a
# LICENSE file may carry it only alongside a grant clause; a README
# declaration never may, since "MIT. All rights reserved." grants nothing.
RESERVED='All rights reserved'
GRANT='Permission is hereby granted|Permission to use, copy, modify|Redistribution and use in source and binary forms|hereby grants? (to )?You|free and unencumbered|hereby overtly, fully, permanently'

# check_license_text <repo> <license> <text> <where>
check_license_text() {
  local repo="$1" license="$2" text="$3" where="$4"
  if printf '%s\n' "$text" | grep -qiE "$REFUSED"; then
    echo "!! $repo: $where reads as a refused licence (copyleft or -NC) — refusing (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
  if printf '%s\n' "$text" | grep -qiE "$RESERVED"; then
    if [ "$where" = "README.md License section" ] || ! printf '%s\n' "$text" | grep -qiE "$GRANT"; then
      echo "!! $repo: $where says all rights reserved and grants nothing — refusing (ABSORPTION.md gate 1)" >&2
      exit 1
    fi
  fi
  if ! printf '%s\n' "$text" | grep -qiE "${ALLOWED[$license]}" \
     || { [ -n "${EXCLUDES[$license]+x}" ] && printf '%s\n' "$text" | grep -qiE "${EXCLUDES[$license]}"; }; then
    echo "!! $repo: $where does not read as $license, the licence SOURCES.md declares — fix UPSTREAM[] or drop the entry (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
}

# resolve_license <clone> <repo> <license> <src> <out>
# Writes to <out> exactly what the skill's UPSTREAM-LICENSE must contain: the
# upstream LICENSE file when one exists, else a record of the README's License
# declaration. Exits 1 when the declaration is missing, mismatched or refused.
# Reads the clone only, so it can run before anything under skills/ is touched.
resolve_license() {
  local clone="$1" repo="$2" license="$3" src="$4" out="$5" lic section
  if [ -z "${ALLOWED[$license]+x}" ]; then
    echo "!! $repo: licence '$license' is not on the ABSORPTION.md allowlist — refusing (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
  for lic in LICENSE LICENSE.md LICENSE.txt LICENCE LICENCE.md license.md; do
    if [ -f "$clone/$lic" ]; then
      check_license_text "$repo" "$license" "$(cat "$clone/$lic")" "$lic"
      cp "$clone/$lic" "$out"
      return 0
    fi
  done
  # Some upstreams ship no LICENSE file and declare the licence only in their
  # README (vercel-labs/agent-skills does this). Record that declaration, with
  # the commit it was read from, so the vendored copy still carries provenance.
  section="$(awk '/^##+[[:space:]]+[Ll]icen[cs]e/{f=1; next} /^##+[[:space:]]/{if(f) exit} f' "$clone/README.md" 2>/dev/null | sed '/^[[:space:]]*$/d')"
  if [ -z "$section" ]; then
    echo "!! $repo ships no LICENSE file and its README has no License section — refusing to vendor $src (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
  check_license_text "$repo" "$license" "$section" "README.md License section"
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
  } >"$out"
}

# license_current <expected> <actual>
# The Commit line of a record moves with upstream HEAD even when the skill tree
# does not, so its value is not drift. Its absence is: a record with no commit
# has lost its provenance. Everything else must match byte for byte.
license_current() {
  [ -f "$2" ] || return 1
  if grep -q '^Commit:' "$1" && [ "$(grep -c '^Commit:' "$2")" != 1 ]; then
    return 1
  fi
  diff -q <(grep -v '^Commit:' "$1") <(grep -v '^Commit:' "$2") >/dev/null 2>&1
}

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

declare -A SHAS
drift=0
mkdir -p "$WORK/license"

# ---- pass 1: clone and validate every entry before touching skills/ ----
# A refusal here leaves the vendored tree exactly as it was; a half-synced pack
# with one skill deleted and nothing in its place is worse than a stale one.
for entry in "${UPSTREAM[@]}"; do
  IFS='|' read -r repo license src dest <<<"$entry"
  slug="${repo//\//_}"
  if [ ! -d "$WORK/$slug" ]; then
    echo "→ cloning $repo"
    git clone --depth 1 -q "$UPSTREAM_BASE/$repo.git" "$WORK/$slug"
    SHAS["$repo"]="$(git -C "$WORK/$slug" rev-parse HEAD)"
  fi

  if [ ! -d "$WORK/$slug/$src" ]; then
    echo "!! $repo: upstream path '$src' no longer exists — upstream restructured, fix UPSTREAM[] above" >&2
    exit 1
  fi

  resolve_license "$WORK/$slug" "$repo" "$license" "$src" "$WORK/license/$dest"
done

# ---- pass 2: report drift, or vendor ----
for entry in "${UPSTREAM[@]}"; do
  IFS='|' read -r repo license src dest <<<"$entry"
  slug="${repo//\//_}"

  if [ $CHECK_ONLY -eq 1 ]; then
    # UPSTREAM-LICENSE is written by this script, not by upstream, so it is
    # excluded from the tree comparison and checked on its own: it must exist
    # and say what the upstream's licence says today.
    if ! diff -rq --exclude=UPSTREAM-LICENSE "$WORK/$slug/$src" "$SKILLS_DIR/$dest" >/dev/null 2>&1; then
      echo "DRIFT  $dest  (upstream $repo @ ${SHAS[$repo]:0:8})"
      drift=1
    elif ! license_current "$WORK/license/$dest" "$SKILLS_DIR/$dest/UPSTREAM-LICENSE"; then
      echo "DRIFT  $dest  (UPSTREAM-LICENSE missing or stale — upstream $repo @ ${SHAS[$repo]:0:8})"
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
  # The upstream licence travels with the skill so attribution survives a copy.
  # Unlink first: cp writes through a destination symlink, and an upstream that
  # ships UPSTREAM-LICENSE as a symlink would otherwise choose where the record
  # lands on the machine running the sync.
  rm -f "$SKILLS_DIR/$dest/UPSTREAM-LICENSE"
  cp "$WORK/license/$dest" "$SKILLS_DIR/$dest/UPSTREAM-LICENSE"
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
