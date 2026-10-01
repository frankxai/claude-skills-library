#!/usr/bin/env python3
"""Validate every SKILL.md against the Agent Skills frontmatter spec.

Hard checks (a failure makes the script exit non-zero — wire it into CI):
  * the file is valid UTF-8 and not empty
  * YAML frontmatter is present and well-formed
  * `name` exists, is <= 64 chars, and matches ^[a-z0-9][a-z0-9-]*$
  * `description` exists, is non-empty, and is <= 1024 chars
  * the skill file is named exactly `SKILL.md` (Claude Code requires the
    uppercase name for discovery)

Usage:
  validate_skills.py                 walk the default roots (free-skills, absorbed)
  validate_skills.py <path> [...]    walk only these directories or files

`absorbed/` is in the default set because ABSORPTION.md gate 4 holds absorbed
skills to the same format bar as written ones, and a bar nothing checks is not a
bar. `absorbed/_staging/` is always skipped: staging is what the gates read
*before* a decision, so validating it here would pass judgement twice.

Soft checks (reported as warnings, never fail the build):
  * body longer than 500 lines (Anthropic recommends keeping SKILL.md lean
    and pushing depth into references/)
  * `name` containing a reserved word (`anthropic`, `claude`)
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from _skillmeta import FM_RE, parse_frontmatter, read_text  # noqa: E402

import re  # noqa: E402

REPO = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_ROOTS = ("free-skills", "absorbed")
STAGING = "_staging"
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
RESERVED = ("anthropic", "claude")
MAX_BODY_LINES = 500


def skill_files(targets: list[str]) -> list[str]:
    """Every SKILL.md under the given paths, staging excluded. A path may be a file."""
    found: list[str] = []
    for target in targets:
        if os.path.isfile(target):
            if os.path.basename(target).lower() == "skill.md":
                found.append(target)
            continue
        for dirpath, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if d != STAGING]
            for fn in files:
                if fn.lower() == "skill.md":
                    found.append(os.path.join(dirpath, fn))
    return sorted(found)


def main(argv: list[str]) -> int:
    errors: list[str] = []
    warnings: list[str] = []

    if argv:
        targets = []
        for raw in argv:
            path = raw if os.path.isabs(raw) else os.path.join(REPO, raw)
            if not os.path.exists(path):
                print(f"FAIL: no such path: {raw}")
                return 2
            targets.append(path)
    else:
        # A default root that does not exist yet is not a failure: `absorbed/`
        # appears the first time something clears the gates.
        targets = [p for p in (os.path.join(REPO, r) for r in DEFAULT_ROOTS) if os.path.exists(p)]

    files = skill_files(targets)
    count = len(files)
    for full in files:
        fn = os.path.basename(full)
        rel = os.path.relpath(full, REPO).replace(os.sep, "/")

        if fn != "SKILL.md":
            errors.append(f"{rel}: file must be named 'SKILL.md' (got {fn!r})")

        try:
            text = read_text(full)
        except UnicodeDecodeError as exc:
            errors.append(f"{rel}: not valid UTF-8 ({exc})")
            continue
        if not text.strip():
            errors.append(f"{rel}: file is empty")
            continue

        fm = parse_frontmatter(text)
        if fm is None:
            errors.append(f"{rel}: missing or malformed YAML frontmatter")
            continue

        name = fm.get("name", "")
        if not name:
            errors.append(f"{rel}: missing 'name'")
        elif not NAME_RE.match(name):
            errors.append(f"{rel}: 'name' must match ^[a-z0-9][a-z0-9-]*$ (got {name!r})")
        elif len(name) > 64:
            errors.append(f"{rel}: 'name' exceeds 64 characters")
        elif name in RESERVED:
            warnings.append(f"{rel}: 'name' is a reserved word ({name!r})")

        desc = fm.get("description", "")
        if not desc:
            errors.append(f"{rel}: missing 'description'")
        elif len(desc) > 1024:
            errors.append(f"{rel}: 'description' exceeds 1024 characters ({len(desc)})")

        fmm = FM_RE.match(text)
        body_lines = len(text[fmm.end():].splitlines()) if fmm else len(text.splitlines())
        if body_lines > MAX_BODY_LINES:
            warnings.append(f"{rel}: body is {body_lines} lines (>{MAX_BODY_LINES}); "
                            "consider splitting into references/")

    if warnings:
        print(f"{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  ! {w}")
        print()

    if errors:
        print(f"FAIL: {len(errors)} error(s) across {count} skill file(s):\n")
        for e in errors:
            print(f"  - {e}")
        return 1
    print(f"OK: {count} skill file(s) are spec-compliant.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
