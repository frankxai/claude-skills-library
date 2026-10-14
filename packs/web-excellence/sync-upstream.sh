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
# Registered before anything can exit, so a refused override or entry leaves
# nothing behind in $TMPDIR.
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT
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
  if [ ! -r "$WEB_EXCELLENCE_UPSTREAM_FILE" ]; then
    echo "!! WEB_EXCELLENCE_UPSTREAM_FILE is not readable: $WEB_EXCELLENCE_UPSTREAM_FILE" >&2
    exit 2
  fi
  mapfile -t UPSTREAM < <(grep -v '^[[:space:]]*\(#\|$\)' "$WEB_EXCELLENCE_UPSTREAM_FILE" || true)
  if [ ${#UPSTREAM[@]} -eq 0 ]; then
    echo "!! WEB_EXCELLENCE_UPSTREAM_FILE lists no entries: $WEB_EXCELLENCE_UPSTREAM_FILE" >&2
    exit 2
  fi
fi
UPSTREAM_BASE="${WEB_EXCELLENCE_UPSTREAM_BASE:-https://github.com}"

# Every entry is validated before a clone, let alone a removal. Pass 2 runs
# rm -rf on "$SKILLS_DIR/$dest", so an empty or traversing dest would reach
# far beyond one skill, a native dest would delete a skill authored here, and
# a dest listed twice would have the second row silently replace the first
# and leave a tree --check can never pass. A bad row is refused with exit 2.
declare -A SEEN_DEST
for entry in "${UPSTREAM[@]}"; do
  IFS='|' read -r e_repo e_license e_src e_dest e_extra <<<"$entry"
  if [ -n "${e_extra:-}" ] || [ -z "$e_repo" ] || [ -z "$e_license" ] || [ -z "$e_src" ] || [ -z "$e_dest" ]; then
    echo "!! UPSTREAM entry needs exactly four non-empty fields repo|license|src|dest: '$entry'" >&2
    exit 2
  fi
  if ! [[ "$e_repo" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]]; then
    echo "!! UPSTREAM entry has a malformed repo '$e_repo': '$entry'" >&2
    exit 2
  fi
  if ! [[ "$e_dest" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || [ "$e_dest" = "." ] || [ "$e_dest" = ".." ]; then
    echo "!! UPSTREAM entry has an unsafe dest '$e_dest' (one plain directory name, no slashes): '$entry'" >&2
    exit 2
  fi
  case " $NATIVE " in
    *" $e_dest "*) echo "!! UPSTREAM entry targets '$e_dest', a skill native to this pack that a sync never overwrites: '$entry'" >&2; exit 2 ;;
  esac
  if [ -n "${SEEN_DEST[$e_dest]+x}" ]; then
    echo "!! UPSTREAM lists dest '$e_dest' twice; the second row would silently replace the first: '$entry'" >&2
    exit 2
  fi
  SEEN_DEST["$e_dest"]=1
  case "/$e_src/" in
    *"/../"*|*"//"*) echo "!! UPSTREAM entry has an unsafe src '$e_src' (relative, no .. or empty components): '$entry'" >&2; exit 2 ;;
  esac
done
unset e_repo e_license e_src e_dest e_extra SEEN_DEST

# ABSORPTION.md gate 1. Key: the licence SOURCES.md may declare. Value: what the
# upstream's LICENSE file, or its README declaration, must contain to count as
# that licence. Word-bounded so "LIMITED" in a GPL text never reads as MIT.
declare -A ALLOWED=(
  [MIT]='(^|[^[:alnum:]])MIT([^[:alnum:]]|$)'
  [Apache-2.0]='Version 2\.0, January 2004|Apache License,? Version 2\.0|Apache License 2\.0|Apache-2\.0'
  [BSD-2-Clause]='BSD[- ]2|2-Clause|Simplified BSD|Redistributions of source code must retain'
  [BSD-3-Clause]='BSD[- ]3|3-Clause|Neither the name of'
  [ISC]='(^|[^[:alnum:]])ISC([^[:alnum:]]|$)|Permission to use, copy, modify, and/or distribute'
  [CC0-1.0]='CC0|Creative Commons Zero'
  [CC-BY-4.0]='CC-BY-4\.0|CC BY 4\.0|Attribution 4\.0 International'
  [Unlicense]='Unlicense|This is free and unencumbered software'
)
# The BSD variants share their first two clauses, so each allowed one is also
# refused when the text carries another's marker: the third clause names
# BSD-3, and the advertising clause names BSD-4, which is not on the allowlist
# and would otherwise pass as BSD-3 since it carries the same third clause.
declare -A EXCLUDES=(
  [BSD-2-Clause]='BSD[- ]3|3-Clause|Neither the name of|BSD[- ]4|4-Clause|advertising materials'
  [BSD-3-Clause]='BSD[- ]2|2-Clause|Simplified BSD|BSD[- ]4|4-Clause|advertising materials'
  [MIT]='MIT-0|No Attribution'
  [Apache-2.0]='Version 1\.[01]|Apache-1\.|Apache License 1\.'
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
# Use restrictions bolted onto a permissive text (the Hippocratic family and
# its relatives) keep the grant clause and add a prohibition after it. The
# canonical permissive texts never phrase a restriction this way. This is a
# heuristic for the known riders, not exact licence matching; see SOURCES.md.
RIDER='(shall|may|must|can) ?not be used|not be used (by|for)|Hippocratic|Human Rights|surveillance|unethical'
# A bare declaration (a README section, or a LICENSE file that just says
# "MIT") must say nothing but the licence. One that negates or qualifies it
# ("not licensed under MIT", "MIT except assets", "contact us for commercial
# terms") is no declaration and needs a human read.
QUALIFIED='(^|[^[:alnum:]])(not|no|never|except|exceptions?|unless|proprietary|dual|commercial|contact|restricted)([^[:alnum:]]|$)'
GRANT='Permission is hereby granted|Permission to use, copy, modify|Redistribution and use in source and binary forms|hereby grants? (to )?You|free and unencumbered|hereby overtly, fully, permanently'

# check_license_text <repo> <license> <text> <where>
check_license_text() {
  local repo="$1" license="$2" text="$3" where="$4"
  if printf '%s\n' "$text" | grep -qiE "$REFUSED"; then
    echo "!! $repo: $where reads as a refused licence (copyleft or -NC) — refusing (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
  if printf '%s\n' "$text" | grep -qiE "$RIDER"; then
    echo "!! $repo: $where carries a use restriction on top of its grant — refusing; a permissive text with a rider is not the permissive licence (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
  # Two kinds of input. A recognised licence text carries a grant clause, and
  # that clause is what the gate trusts. Anything without one is a bare
  # declaration, whether it came from a README section or a one-line LICENSE
  # file, and a declaration may say nothing but the licence.
  if ! printf '%s\n' "$text" | grep -qiE "$GRANT"; then
    if printf '%s\n' "$text" | grep -qiE "$RESERVED"; then
      echo "!! $repo: $where says all rights reserved and grants nothing — refusing (ABSORPTION.md gate 1)" >&2
      exit 1
    fi
    if printf '%s\n' "$text" | grep -qiE "$QUALIFIED"; then
      echo "!! $repo: $where qualifies or negates its declaration — refusing; this upstream needs a human read (ABSORPTION.md gate 1)" >&2
      exit 1
    fi
  fi
  if ! printf '%s\n' "$text" | grep -qiE "${ALLOWED[$license]}" \
     || { [ -n "${EXCLUDES[$license]+x}" ] && printf '%s\n' "$text" | grep -qiE "${EXCLUDES[$license]}"; }; then
    echo "!! $repo: $where does not read as $license, the licence SOURCES.md declares — fix UPSTREAM[] or drop the entry (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
}

# extract_license_sections <README path>
# The body of every heading that reads exactly "License", "Licence" or
# "Licensing" (any case, optional trailing colon), each running to the next
# heading of the same or a higher level and terminated by a line reading
# ----8<----. Both heading forms count: ATX ("## License") and Setext
# ("License" underlined with === or ---). Sub-headings stay in: a
# "### Exceptions" under "## License" is part of the declaration. A heading
# that merely starts with the word, such as "License compatibility", is prose.
# Lines inside fenced code blocks are never headings: an example README
# template in a fence cannot license the upstream. A fence closes only on a
# run of its own character at least as long as the opener, as Markdown has
# it, so a three-backtick example inside a four-backtick fence stays inside.
# An HTML comment block (a line opening with <!--, through the line that
# carries -->) is not rendered, so nothing in it is a heading or part of a
# declaration: a commented-out README template licenses nothing. An ATX
# heading may be indented up to three spaces, as Markdown allows; four is
# a code block.
extract_license_sections() {
  awk '
    function is_lic(t) { t = tolower(t); sub(/[ \t:]+$/, "", t); return (t == "license" || t == "licence" || t == "licensing") }
    { L[NR] = $0 }
    END {
      fence = 0; comment = 0; f = 0; lvl = 0
      for (i = 1; i <= NR; i++) {
        line = L[i]
        if (fence) {
          if (match(line, /^[ \t]*(`+|~+)[ \t]*$/)) {
            run = line; gsub(/[ \t]/, "", run)
            if (substr(run, 1, 1) == fch && length(run) >= flen) fence = 0
          }
          if (f) print line; continue
        }
        if (match(line, /^[ \t]*(```+|~~~+)/)) {
          run = substr(line, RSTART, RLENGTH); gsub(/[ \t]/, "", run)
          fch = substr(run, 1, 1); flen = length(run); fence = 1
          if (f) print line; continue
        }
        if (comment) { if (index(line, "-->")) comment = 0; continue }
        if (line ~ /^ {0,3}<!--/) {
          if (!index(substr(line, index(line, "<!--") + 4), "-->")) comment = 1
          continue
        }
        h = 0; skip = 0
        if (line ~ /^ {0,3}#+[ \t]+/) {
          text = line; sub(/^ {0,3}/, "", text)
          match(text, /^#+/); h = RLENGTH
          sub(/^#+[ \t]+/, "", text); sub(/[ \t]+#+[ \t]*$/, "", text)
        } else if (i < NR && line ~ /[^ \t]/ && line !~ /^[ \t]*[-=*#>|]/ && (L[i+1] ~ /^[ \t]*=+[ \t]*$/ || L[i+1] ~ /^[ \t]*-+[ \t]*$/)) {
          h = (L[i+1] ~ /^[ \t]*=+[ \t]*$/) ? 1 : 2
          text = line; sub(/^[ \t]+/, "", text); sub(/[ \t]+$/, "", text); skip = 1
        }
        if (h) {
          if (f && h <= lvl) { f = 0; print "----8<----" }
          if (!f && is_lic(text)) { f = 1; lvl = h }
          else if (f) print line
          if (skip) i++
          continue
        }
        if (f) print line
      }
      if (f) print "----8<----"
    }' "$1" 2>/dev/null | sed '/^[[:space:]]*$/d'
}

# resolve_license <clone> <repo> <license> <src> <out>
# Writes to <out> exactly what the skill's UPSTREAM-LICENSE must contain: the
# licence file nearest the skill when one exists, else a record of the nearest
# README declaration. Exits 1 when anything is missing, mismatched or refused.
# Reads the clone only, so it can run before anything under skills/ is touched.
resolve_license() {
  local clone="$1" repo="$2" license="$3" src="$4" out="$5"
  local dir rel lic section nearest_file="" nearest_decl=""
  if [ -z "${ALLOWED[$license]+x}" ]; then
    echo "!! $repo: licence '$license' is not on the ABSORPTION.md allowlist — refusing (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
  # The name this script writes at the skill root is reserved. An upstream
  # that ships it, as a file, directory or symlink, would collide with the
  # record, so it is refused rather than overwritten.
  if [ -e "$clone/$src/UPSTREAM-LICENSE" ] || [ -L "$clone/$src/UPSTREAM-LICENSE" ]; then
    echo "!! $repo: $src ships its own UPSTREAM-LICENSE, the name this script reserves for the licence record — refusing (ABSORPTION.md gate 1)" >&2
    exit 1
  fi
  # Walk from the skill up to the repo root. Every licence file and every
  # README declaration on the way is checked against the declared licence, so
  # a root MIT cannot launder a skill-local GPL and two files at one level
  # cannot disagree. The nearest licence file is the one recorded; failing
  # that, the nearest README declaration. Then the whole skill subtree is
  # scanned the same way, since cp -R publishes every nested file: a
  # vendor/LICENSE-GPL three levels down is checked and refused too, but
  # never recorded. A nested UPSTREAM-LICENSE is a licence input like any
  # other there; only the skill-root name is reserved. Symlinks are refused
  # everywhere: a file operator follows them, and a hostile upstream could
  # point one at any readable local file.
  check_candidate() {  # <path> <relative label> <may-record 0|1>
    local path="$1" label="$2" record="$3" lic section cur
    lic="$(basename "$path")"
    if [ -L "$path" ]; then
      echo "!! $repo: $label is a symlink; licence inputs must be regular files inside the clone — refusing (ABSORPTION.md gate 1)" >&2
      exit 1
    fi
    if [ -d "$path" ]; then
      echo "!! $repo: $label is a directory of licences; a multi-licence tree needs a human read — refusing (ABSORPTION.md gate 1)" >&2
      exit 1
    fi
    [ -f "$path" ] || return 0
    case "$lic" in
      [Rr][Ee][Aa][Dd][Mm][Ee].[Mm][Dd])
        cur=""
        while IFS= read -r line; do
          if [ "$line" = "----8<----" ]; then
            if [ -n "$cur" ]; then
              check_license_text "$repo" "$license" "$cur" "$label License section"
              [ "$record" = 1 ] && [ -z "$nearest_decl" ] && nearest_decl="$cur"
            fi
            cur=""
          else
            cur+="$line"$'\n'
          fi
        done < <(extract_license_sections "$path")
        ;;
      *)
        check_license_text "$repo" "$license" "$(cat "$path")" "$label"
        [ "$record" = 1 ] && [ -z "$nearest_file" ] && nearest_file="$path"
        ;;
    esac
    return 0
  }
  dir="$clone/$src"
  local -a candidates
  while :; do
    rel="${dir#"$clone"}"; rel="${rel#/}"
    # Anything that looks like a licence file counts, whatever its suffix or
    # case: LICENSE, LICENSE.md, LICENSE-MIT, LICENCE.txt, COPYING, UNLICENSE.
    # The README is spelled with a bracket so it is a pattern too: nocaseglob
    # only applies to a word that contains a glob character, and a literal
    # README.md would miss README.MD on a case-sensitive checkout.
    shopt -s nullglob nocaseglob
    candidates=("$dir"/LICENSE* "$dir"/LICENCE* "$dir"/COPYING* "$dir"/UNLICENSE* "$dir"/README.[Mm][Dd])
    shopt -u nullglob nocaseglob
    for path in "${candidates[@]}"; do
      check_candidate "$path" "${rel:+$rel/}$(basename "$path")" 1
    done
    [ "$dir" = "$clone" ] && break
    dir="$(dirname "$dir")"
  done
  while IFS= read -r -d '' path; do
    check_candidate "$path" "${path#"$clone"/}" 0
  done < <(find "$clone/$src" -mindepth 2 \( -iname 'LICENSE*' -o -iname 'LICENCE*' -o -iname 'COPYING*' -o -iname 'UNLICENSE*' -o -iname 'UPSTREAM-LICENSE' -o -iname 'README.md' \) -print0 2>/dev/null)
  # Agent Skills frontmatter may carry a license field. A skill that says
  # "license: GPL-3.0" under an MIT root is not MIT whatever the root file
  # says, so the field is read as a bare declaration, in the selected skill
  # and in every SKILL.md nested inside it. A value that is not the plain
  # licence name ("see LICENSE.txt") is refused the same way and needs a
  # human read.
  local decl
  while IFS= read -r -d '' path; do
    decl="$(awk 'NR == 1 { if ($0 != "---") exit; next }
                 $0 == "---" { exit }
                 /^license[ \t]*:/ { sub(/^license[ \t]*:[ \t]*/, ""); gsub(/^[\042\047]|[\042\047]$/, ""); print; exit }' "$path" 2>/dev/null)"
    [ -n "$decl" ] && check_license_text "$repo" "$license" "$decl" "${path#"$clone"/} frontmatter license"
  done < <(find "$clone/$src" -iname 'SKILL.md' -type f -print0 2>/dev/null)
  if [ -n "$nearest_file" ]; then
    cp "$nearest_file" "$out"
    return 0
  fi
  # Some upstreams ship no LICENSE file and declare the licence only in a
  # README (vercel-labs/agent-skills does this). Record that declaration, with
  # the commit it was read from, so the vendored copy still carries provenance.
  if [ -z "$nearest_decl" ]; then
    echo "!! $repo ships no LICENSE file and no README has a License section — refusing to vendor $src (ABSORPTION.md gate 1)" >&2
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
    printf '%s\n' "$nearest_decl" | sed 's/^/    /'
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
  # A symlink is not a self-contained record, whatever it points at.
  [ -L "$2" ] && return 1
  [ -f "$2" ] || return 1
  if grep -q '^Commit:' "$1"; then
    [ "$(grep -c '^Commit:' "$2")" = 1 ] || return 1
    diff -q <(grep -v '^Commit:' "$1") <(grep -v '^Commit:' "$2") >/dev/null 2>&1
  else
    # A raw upstream LICENSE has no Commit field; nothing in it is ignorable.
    cmp -s "$1" "$2"
  fi
}

declare -A SHAS CLONES
n_clones=0
drift=0
mkdir -p "$WORK/license" "$WORK/clone"

# ---- pass 1: clone and validate every entry before touching skills/ ----
# A refusal here leaves the vendored tree exactly as it was; a half-synced pack
# with one skill deleted and nothing in its place is worse than a stale one.
for entry in "${UPSTREAM[@]}"; do
  IFS='|' read -r repo license src dest <<<"$entry"
  # One clone per repo, in a numbered directory, never a flattening of the
  # repo name: a/b_c and a_b/c would flatten to the same name and the second
  # would read the first's clone.
  if [ -z "${CLONES[$repo]+x}" ]; then
    CLONES["$repo"]="$WORK/clone/$n_clones"
    n_clones=$((n_clones + 1))
    echo "→ cloning $repo"
    git clone --depth 1 -q "$UPSTREAM_BASE/$repo.git" "${CLONES[$repo]}"
    SHAS["$repo"]="$(git -C "${CLONES[$repo]}" rev-parse HEAD)"
  fi
  clone="${CLONES[$repo]}"

  # git recreates an upstream symlink as a symlink, -d follows it, and so
  # would the cp -R of the directory itself: a src that is or crosses a
  # link could vendor whatever the link points at on this machine.
  p="$clone"
  IFS=/ read -ra comps <<<"$src"
  for comp in "${comps[@]}"; do
    p="$p/$comp"
    if [ -L "$p" ]; then
      echo "!! $repo: '$src' is or crosses a symlink at '${p#"$clone"/}'; the source must be a real directory inside the clone — refusing" >&2
      exit 1
    fi
  done
  unset p comps comp
  if [ ! -d "$clone/$src" ]; then
    echo "!! $repo: upstream path '$src' no longer exists — upstream restructured, fix UPSTREAM[] above" >&2
    exit 1
  fi

  resolve_license "$clone" "$repo" "$license" "$src" "$WORK/license/$dest"

  # Symlinks anywhere inside the skill are refused too: cp -R copies them as
  # links, so every install would carry a pointer off the tree, and the
  # installers already treat such a copy as never canonical.
  link="$(find "$clone/$src" -type l -print -quit 2>/dev/null)"
  if [ -n "$link" ]; then
    echo "!! $repo: '$src' contains a symlink at '${link#"$clone"/}'; a vendored tree must be self-contained — refusing" >&2
    exit 1
  fi
  unset link
done

# ---- pass 2: report drift, or vendor ----
for entry in "${UPSTREAM[@]}"; do
  IFS='|' read -r repo license src dest <<<"$entry"
  clone="${CLONES[$repo]}"

  if [ $CHECK_ONLY -eq 1 ]; then
    # The root UPSTREAM-LICENSE is written by this script, not by upstream, so
    # that one path is dropped from the tree comparison and checked on its
    # own below. Only the root: a nested file of the same name is upstream
    # content and drifts like any other.
    tree_drift="$(diff -rq "$clone/$src" "$SKILLS_DIR/$dest" 2>&1 \
      | grep -vxF -e "Only in $SKILLS_DIR/$dest: UPSTREAM-LICENSE" || true)"
    if [ -n "$tree_drift" ]; then
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
  cp -R "$clone/$src/." "$SKILLS_DIR/$dest/"
  # The upstream licence travels with the skill so attribution survives a copy.
  # Pass 1 refused any upstream that ships this name itself, so nothing is
  # here to be overwritten or written through.
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
