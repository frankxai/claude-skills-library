#!/usr/bin/env python3
"""Tests for the web-excellence installer's skill handling.

    python3 packs/web-excellence/tests/test_install.py

Zero dependencies, no pytest. The contract under test: an installed skill that
matches the pack is left alone; one that differs is moved, never deleted, to a
set-aside the next run cannot overwrite.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
INSTALL = os.path.join(PACK, "install.sh")
SKILL = "web-release-gate"  # native, small, always installed

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def install(target: str, *flags: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["bash", INSTALL, target, "--skills-only", "--no-db", *flags],
        capture_output=True, text=True,
    )


def set_asides(target: str) -> list[str]:
    root = os.path.join(target, ".claude", "skills", ".replaced")
    if not os.path.isdir(root):
        return []
    return sorted(d for d in os.listdir(root) if d.startswith(SKILL + "."))


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        target = os.path.join(tmp, "repo")
        os.makedirs(target)

        r = install(target)
        check("first install exits 0", r.returncode == 0, r.stderr)
        check("first install adds the skill", f"  add    {SKILL}" in r.stdout)
        installed = os.path.join(target, ".claude", "skills", SKILL)
        check("skill is on disk", os.path.isfile(os.path.join(installed, "SKILL.md")))

        r = install(target)
        check("clean re-run exits 0", r.returncode == 0, r.stderr)
        check("clean re-run reports the skill as canonical", f"  ok     {SKILL}" in r.stdout, r.stdout)
        check("clean re-run creates no set-aside", set_asides(target) == [], str(set_asides(target)))

        # ui-ux-pro-max is skipped by --no-db here, but the rule it exists for
        # is general: a bytecode cache beside a skill is not a divergence.
        os.makedirs(os.path.join(installed, "__pycache__"))
        open(os.path.join(installed, "__pycache__", "x.pyc"), "w").close()
        r = install(target)
        check("a __pycache__ beside the skill is not a divergence", set_asides(target) == [], r.stdout)
        shutil.rmtree(os.path.join(installed, "__pycache__"))

        with open(os.path.join(installed, "LOCAL.md"), "w", encoding="utf-8") as fh:
            fh.write("local fork marker\n")
        r = install(target)
        check("diverged copy: install exits 0", r.returncode == 0, r.stderr)
        asides = set_asides(target)
        check("diverged copy is set aside once", len(asides) == 1, str(asides))
        check(
            "set-aside keeps the local file",
            bool(asides) and os.path.isfile(os.path.join(target, ".claude", "skills", ".replaced", asides[0], "LOCAL.md")),
        )
        check("installed skill is the pack's again", not os.path.exists(os.path.join(installed, "LOCAL.md")))

        with open(os.path.join(installed, "LOCAL.md"), "w", encoding="utf-8") as fh:
            fh.write("second fork marker\n")
        r = install(target)
        asides = set_asides(target)
        check("second divergence does not overwrite the first set-aside", len(asides) == 2, str(asides))

        r = install(target, "--dry-run")
        check("dry run exits 0", r.returncode == 0, r.stderr)
        check("dry run adds no set-aside", len(set_asides(target)) == 2)

    print()
    if failures:
        print(f"{len(failures)} failing: {', '.join(failures)}")
        return 1
    print("all install tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
