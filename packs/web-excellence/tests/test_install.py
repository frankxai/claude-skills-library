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


def read(path: str) -> str:
    with open(path, encoding="utf-8", newline="") as fh:
        return fh.read()


def claude_md_cases() -> None:
    """--claude-md writes one fenced block, replaces it in place, and never overwrites a hand-written section."""
    BEGIN, END = "<!-- web-excellence:begin -->", "<!-- web-excellence:end -->"
    with tempfile.TemporaryDirectory() as tmp:
        t = os.path.join(tmp, "repo")
        os.makedirs(t)
        r = install(t)
        check("without --claude-md no prompt file is created",
              r.returncode == 0 and not os.path.exists(os.path.join(t, "CLAUDE.md")) and not os.path.exists(os.path.join(t, "AGENTS.md")))
        full = subprocess.run(["bash", INSTALL, t, "--no-db", "--no-ci", "--no-agents"], capture_output=True, text=True)
        check("a full install without the flag says how to get the block, and writes no prompt file",
              full.returncode == 0 and "--claude-md" in full.stdout and not os.path.exists(os.path.join(t, "CLAUDE.md")), full.stdout[-300:])

    with tempfile.TemporaryDirectory() as tmp:
        t = os.path.join(tmp, "repo")
        os.makedirs(t)
        r = install(t, "--claude-md")
        text = read(os.path.join(t, "CLAUDE.md")) if os.path.isfile(os.path.join(t, "CLAUDE.md")) else ""
        check("--claude-md creates CLAUDE.md when no prompt file exists", r.returncode == 0 and BEGIN in text and END in text, r.stdout[-300:])
        check("the block names the governor, the four recipes, the site map and the probe",
              all(w in text for w in ("`gpu-surface`", "`liquid-logo`", "`shader-backdrop`", "`liquid-glass`", "`r3f-scene`", "`material-system`", "probe.mjs")))
        check("the block names the three web agents",
              all(w in text for w in ("worker-web-builder", "worker-visual-qa", "worker-web-steward")))
        before = text
        r = install(t, "--claude-md")
        check("a second run leaves the file byte-identical", read(os.path.join(t, "CLAUDE.md")) == before and "gate block is current" in r.stdout, r.stdout[-200:])
        check("the block appears once", before.count(BEGIN) == 1)

    with tempfile.TemporaryDirectory() as tmp:
        t = os.path.join(tmp, "repo")
        os.makedirs(t)
        with open(os.path.join(t, "CLAUDE.md"), "w", encoding="utf-8", newline="") as fh:
            fh.write("# Repo\n\nOwn rules above.\n\n" + BEGIN + "\nstale text\n" + END + "\n\n## Below\nOwn rules below.\n")
        with open(os.path.join(t, "AGENTS.md"), "w", encoding="utf-8", newline="") as fh:
            fh.write("# Agents\n")
        r = install(t, "--claude-md")
        c, a = read(os.path.join(t, "CLAUDE.md")), read(os.path.join(t, "AGENTS.md"))
        check("a stale block is replaced in place and the text around it is untouched",
              "stale text" not in c and c.startswith("# Repo\n\nOwn rules above.\n\n" + BEGIN)
              and c.endswith("## Below\nOwn rules below.\n") and "`gpu-surface`" in c, c[:200])
        check("AGENTS.md gets the block too, below its existing content",
              a.startswith("# Agents\n") and BEGIN in a and "`gpu-surface`" in a, a[:200])

    with tempfile.TemporaryDirectory() as tmp:
        t = os.path.join(tmp, "repo")
        os.makedirs(t)
        own = "# Repo\n\n## Web design gate \u2014 load-bearing\n\nOur own wording.\n"
        with open(os.path.join(t, "CLAUDE.md"), "w", encoding="utf-8", newline="") as fh:
            fh.write(own)
        r = install(t, "--claude-md")
        check("a hand-written web design gate section is kept untouched",
              read(os.path.join(t, "CLAUDE.md")) == own and "keep   CLAUDE.md" in r.stdout and "gpu-surface" in r.stdout, r.stdout[-300:])

    with tempfile.TemporaryDirectory() as tmp:
        t = os.path.join(tmp, "repo")
        os.makedirs(t)
        with open(os.path.join(t, "CLAUDE.md"), "w", encoding="utf-8", newline="") as fh:
            fh.write("# Repo\r\n\r\nRules.\r\n")
        install(t, "--claude-md")
        raw = open(os.path.join(t, "CLAUDE.md"), "rb").read()
        check("a CRLF file stays CRLF throughout", b"\r\n" in raw and raw.count(b"\n") == raw.count(b"\r\n"))

    with tempfile.TemporaryDirectory() as tmp:
        t = os.path.join(tmp, "repo")
        os.makedirs(t)
        real = os.path.join(tmp, "elsewhere.md")
        with open(real, "w", encoding="utf-8") as fh:
            fh.write("target\n")
        os.symlink(real, os.path.join(t, "CLAUDE.md"))
        r = install(t, "--claude-md")
        check("a symlinked prompt file is not written through", read(real) == "target\n" and "symlink" in r.stdout, r.stdout[-200:])

    with tempfile.TemporaryDirectory() as tmp:
        t = os.path.join(tmp, "repo")
        os.makedirs(t)
        r = install(t, "--claude-md", "--dry-run")
        check("--dry-run reports the block and writes nothing",
              r.returncode == 0 and "would: add the gate block in CLAUDE.md" in r.stdout and not os.path.exists(os.path.join(t, "CLAUDE.md")), r.stdout[-300:])


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
        r = install(target)
        asides = set_asides(target)
        check("second divergence does not overwrite the first set-aside", len(asides) == 4, str(asides))

        r = install(target, "--dry-run")
        check("dry run exits 0", r.returncode == 0, r.stderr)
        check("dry run adds no set-aside", len(set_asides(target)) == 4)

    claude_md_cases()

    print()
    if failures:
        print(f"{len(failures)} failing: {', '.join(failures)}")
        return 1
    print("all install tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
