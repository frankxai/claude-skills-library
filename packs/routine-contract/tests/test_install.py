#!/usr/bin/env python3
"""Tests for the routine-contract installer's skill handling.

    python3 packs/routine-contract/tests/test_install.py

Zero dependencies, no pytest. An installed skill identical to the pack's is left
alone; a diverged one is set aside under a name no later run reuses.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
INSTALL = os.path.join(PACK, "install.sh")
SKILL = "routine-contract"

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def install(target: str, *flags: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["bash", INSTALL, target, "--skills-only", *flags], capture_output=True, text=True
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
        installed = os.path.join(target, ".claude", "skills", SKILL)

        r = install(target)
        check("first install exits 0", r.returncode == 0, r.stderr)
        check("skill is on disk", os.path.isfile(os.path.join(installed, "SKILL.md")))

        r = install(target)
        check("clean re-run reports the skill as canonical", f"  ok     {SKILL}" in r.stdout, r.stdout)
        check("clean re-run creates no set-aside", set_asides(target) == [], str(set_asides(target)))

        with open(os.path.join(installed, "LOCAL.md"), "w", encoding="utf-8") as fh:
            fh.write("local fork marker\n")
        install(target)
        asides = set_asides(target)
        check("diverged copy is set aside once", len(asides) == 1, str(asides))
        check(
            "set-aside keeps the local file",
            bool(asides) and os.path.isfile(os.path.join(target, ".claude", "skills", ".replaced", asides[0], "LOCAL.md")),
        )

        # A symlink to an identical external tree is not an install: it must be
        # set aside and replaced with a self-contained copy.
        before = len(set_asides(target))
        external = os.path.join(tmp, "external-" + SKILL)
        shutil.move(installed, external)
        os.symlink(external, installed)
        r = install(target)
        check("symlinked skill: install exits 0", r.returncode == 0, r.stderr)
        check("symlinked skill is replaced by a real directory", os.path.isdir(installed) and not os.path.islink(installed))
        check("symlinked skill was set aside, not deleted", len(set_asides(target)) == before + 1, str(set_asides(target)))
        check("external tree untouched", os.path.isfile(os.path.join(external, "SKILL.md")))

        # A nested symlink to an identical external file is not self-contained
        # either, even though the skill directory itself is real.
        before = len(set_asides(target))
        ext_file = os.path.join(tmp, "external-SKILL.md")
        shutil.move(os.path.join(installed, "SKILL.md"), ext_file)
        os.symlink(ext_file, os.path.join(installed, "SKILL.md"))
        r = install(target)
        check("nested symlink: install exits 0", r.returncode == 0, r.stderr)
        check("nested symlink is replaced by a real file", os.path.isfile(os.path.join(installed, "SKILL.md")) and not os.path.islink(os.path.join(installed, "SKILL.md")))
        check("nested symlink: skill was set aside", len(set_asides(target)) == before + 1, str(set_asides(target)))

        with open(os.path.join(installed, "LOCAL.md"), "w", encoding="utf-8") as fh:
            fh.write("second fork marker\n")
        install(target)
        check("second divergence does not overwrite the first set-aside", len(set_asides(target)) == 4, str(set_asides(target)))

    print()
    if failures:
        print(f"{len(failures)} failing: {', '.join(failures)}")
        return 1
    print("all install tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
