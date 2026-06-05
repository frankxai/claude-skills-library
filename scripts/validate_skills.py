#!/usr/bin/env python3
"""Validate every SKILL.md against the Agent Skills frontmatter spec.

Hard checks (a failure makes the script exit non-zero — wire it into CI):
  * the file is valid UTF-8 and not empty
  * YAML frontmatter is present and well-formed
  * `name` exists, is <= 64 chars, and matches ^[a-z0-9][a-z0-9-]*$
  * `description` exists, is non-empty, and is <= 1024 chars
  * the skill file is named exactly `SKILL.md` (Claude Code requires the
    uppercase name for discovery)

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

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "free-skills"))
REPO = os.path.normpath(os.path.join(ROOT, ".."))
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
RESERVED = ("anthropic", "claude")
MAX_BODY_LINES = 500


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    count = 0
    for dirpath, _dirs, files in os.walk(ROOT):
        for fn in files:
            if fn.lower() != "skill.md":
                continue
            count += 1
            full = os.path.join(dirpath, fn)
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
    sys.exit(main())
