#!/usr/bin/env python3
"""Check internal Markdown links across the repository.

Validates that every relative link target in every tracked .md file exists,
resolving each link against the file it appears in. External links (http/https,
mailto) and pure anchors are skipped. Exit code is non-zero on any broken
link, so this can run in CI.

    python3 scripts/check_links.py
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import urllib.parse

REPO = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
# [text](target) — tolerate titles ("...") and stop at the first closing paren.
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
SKIP_PREFIXES = ("http://", "https://", "mailto:", "#", "/")


def tracked_markdown() -> list[str]:
    out = subprocess.run(["git", "ls-files", "*.md"], cwd=REPO,
                         capture_output=True, text=True, check=True).stdout
    return [l for l in out.splitlines() if l.strip()]


def main() -> int:
    broken: list[str] = []
    files = tracked_markdown()
    in_code = re.compile(r"```")
    for rel in files:
        path = os.path.join(REPO, rel)
        try:
            text = open(path, encoding="utf-8").read()
        except (OSError, UnicodeDecodeError) as exc:
            broken.append(f"{rel}: unreadable ({exc})")
            continue
        # strip fenced code blocks — links inside them are examples, not nav
        parts = in_code.split(text)
        prose = "".join(parts[::2])
        for m in LINK_RE.finditer(prose):
            target = m.group(1)
            if target.startswith(SKIP_PREFIXES):
                continue
            target = urllib.parse.unquote(target.split("#", 1)[0])
            if not target:
                continue
            resolved = os.path.normpath(os.path.join(os.path.dirname(path), target))
            if not os.path.exists(resolved):
                broken.append(f"{rel}: broken link -> {m.group(1)}")

    if broken:
        print(f"FAIL: {len(broken)} broken internal link(s) across {len(files)} markdown files:\n")
        for b in broken:
            print(f"  - {b}")
        return 1
    print(f"OK: no broken internal links across {len(files)} markdown files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
