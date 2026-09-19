#!/usr/bin/env python3
"""Tests for the agent-infrastructure pack installer and sync script.

    python3 packs/agent-infrastructure/tests/test_install.py

Zero dependencies, no pytest — this has to run anywhere the installer does.

The load-bearing ones are test_diverged_copy_is_preserved_and_reported (the
pack exists because same-name divergence bit the estate; an installer that
silently flattened a deliberate local fork would recreate the disease as a
feature) and test_second_run_changes_nothing (idempotency is what makes
"re-run install.sh" a safe upgrade path instead of a gamble).
"""
from __future__ import annotations

import hashlib
import os
import re
import shutil
import subprocess
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
LIB = os.path.dirname(os.path.dirname(PACK))
INSTALL = os.path.join(PACK, "install.sh")
SYNC = os.path.join(PACK, "sync-upstream.sh")
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def manifest_entries() -> list[str]:
    out = []
    with open(os.path.join(PACK, "manifest.txt"), encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#"):
                out.append(line)
    return out


def frontmatter(path: str) -> dict[str, str]:
    text = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}
    fm: dict[str, str] = {}
    for line in m.group(1).splitlines():
        km = re.match(r'^([A-Za-z_-]+):\s*"?(.*?)"?\s*$', line)
        if km:
            fm[km.group(1)] = km.group(2)
    return fm


def tree_hash(root: str) -> str:
    h = hashlib.sha256()
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        for fn in sorted(filenames):
            p = os.path.join(dirpath, fn)
            h.update(os.path.relpath(p, root).encode())
            h.update(open(p, "rb").read())
    return h.hexdigest()


def run_install(target: str, *flags: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["bash", INSTALL, target, *flags], capture_output=True, text=True
    )


# --------------------------------------------------------------------------
def test_manifest_entries_are_valid_skills() -> None:
    entries = manifest_entries()
    check("manifest is not empty", len(entries) > 0)
    seen = set()
    for entry in entries:
        name = os.path.basename(entry)
        src = os.path.join(LIB, entry)
        skill_md = os.path.join(src, "SKILL.md")
        check(f"{entry}: resolves to a skill dir", os.path.isfile(skill_md))
        if not os.path.isfile(skill_md):
            continue
        fm = frontmatter(skill_md)
        check(f"{entry}: frontmatter has name + description",
              bool(fm.get("name")) and bool(fm.get("description")))
        check(f"{entry}: name matches spec regex", bool(NAME_RE.match(fm.get("name", ""))))
        check(f"{entry}: name matches directory", fm.get("name") == name,
              f"{fm.get('name')!r} != {name!r}")
        check(f"{entry}: not listed twice", name not in seen)
        seen.add(name)


def test_install_matches_manifest_and_pins() -> None:
    names = {os.path.basename(e) for e in manifest_entries()}
    pins = {
        m.group(1)
        for m in re.finditer(r"^\| `([a-z0-9-]+)` \|",
                             open(os.path.join(PACK, "SOURCES.md"), encoding="utf-8").read(), re.M)
    }
    check("SOURCES.md pin table lists exactly the manifest", pins == names,
          f"pins-only={pins - names} manifest-only={names - pins}")
    with tempfile.TemporaryDirectory() as target:
        p = run_install(target)
        check("install exits 0", p.returncode == 0, p.stderr)
        installed = set(os.listdir(os.path.join(target, ".claude", "skills")))
        installed.discard(".replaced")
        check("installed skill set == manifest", installed == names,
              f"installed-only={installed - names} manifest-only={names - installed}")
        for entry in manifest_entries():
            name = os.path.basename(entry)
            src, dst = os.path.join(LIB, entry), os.path.join(target, ".claude", "skills", name)
            check(f"{name}: installed copy is byte-identical to canon",
                  tree_hash(src) == tree_hash(dst))


def test_second_run_changes_nothing() -> None:
    with tempfile.TemporaryDirectory() as target:
        run_install(target)
        before = tree_hash(os.path.join(target, ".claude", "skills"))
        gi_before = open(os.path.join(target, ".gitignore"), encoding="utf-8").read()
        p = run_install(target)
        check("re-run exits 0", p.returncode == 0, p.stderr)
        check("re-run reports every skill ok",
              p.stdout.count("  ok     ") == len(manifest_entries()), p.stdout)
        check("re-run reports no DIVERGED", "DIVERGED" not in p.stdout)
        after = tree_hash(os.path.join(target, ".claude", "skills"))
        check("re-run leaves the tree byte-identical", before == after)
        check("no .replaced dir created for clean installs",
              not os.path.isdir(os.path.join(target, ".claude", "skills", ".replaced")))
        gi_after = open(os.path.join(target, ".gitignore"), encoding="utf-8").read()
        check("gitignore entry not duplicated", gi_before == gi_after)


def test_diverged_copy_is_preserved_and_reported() -> None:
    fork = "---\nname: swarm-orchestration\n---\n\n# A deliberate local fork\n"
    with tempfile.TemporaryDirectory() as target:
        d = os.path.join(target, ".claude", "skills", "swarm-orchestration")
        os.makedirs(d)
        open(os.path.join(d, "SKILL.md"), "w", encoding="utf-8").write(fork)
        p = run_install(target)
        check("install exits 0 with a diverged copy present", p.returncode == 0, p.stderr)
        check("diverged copy is named in the output",
              "DIVERGED swarm-orchestration" in p.stdout, p.stdout)
        kept = os.path.join(target, ".claude", "skills", ".replaced",
                            "swarm-orchestration", "SKILL.md")
        check("diverged copy preserved under .replaced/", os.path.isfile(kept))
        if os.path.isfile(kept):
            check("preserved copy is the fork, byte for byte",
                  open(kept, encoding="utf-8").read() == fork)
        canon = os.path.join(LIB, "free-skills", "swarm-orchestration")
        check("canonical version installed in its place",
              tree_hash(canon) == tree_hash(d))


def test_dry_run_writes_nothing() -> None:
    with tempfile.TemporaryDirectory() as target:
        p = run_install(target, "--dry-run")
        check("dry run exits 0", p.returncode == 0, p.stderr)
        check("dry run announces itself", "dry run" in p.stdout)
        check("dry run writes nothing", os.listdir(target) == [])


def test_install_fails_loudly_on_bad_manifest_entry() -> None:
    with tempfile.TemporaryDirectory() as work:
        fake_pack = os.path.join(work, "packs", "agent-infrastructure")
        shutil.copytree(PACK, fake_pack, ignore=shutil.ignore_patterns("tests", "__pycache__"))
        # Only the bad entry: the copied pack resolves the library root to the
        # temp dir, so any real entry would fail first and mask the one under test.
        with open(os.path.join(fake_pack, "manifest.txt"), "w", encoding="utf-8") as fh:
            fh.write("free-skills/does-not-exist\n")
        target = os.path.join(work, "target")
        os.makedirs(target)
        p = subprocess.run(["bash", os.path.join(fake_pack, "install.sh"), target],
                           capture_output=True, text=True)
        check("bad manifest entry exits non-zero", p.returncode != 0)
        check("bad manifest entry is named", "does-not-exist" in p.stderr, p.stderr)


def test_sync_check_passes_on_committed_tree() -> None:
    p = subprocess.run(["bash", SYNC, "--check"], capture_output=True, text=True)
    check("sync --check passes against the committed pin table",
          p.returncode == 0, p.stdout + p.stderr)


def test_sync_check_detects_canon_drift() -> None:
    # Hermetic mini-library: a one-skill canon, sync it, then mutate the canon
    # and prove --check goes red. Never touches the real free-skills/.
    with tempfile.TemporaryDirectory() as work:
        canon = os.path.join(work, "free-skills", "foo")
        os.makedirs(canon)
        open(os.path.join(canon, "SKILL.md"), "w", encoding="utf-8").write(
            "---\nname: foo\ndescription: test skill\n---\n\n# Foo\n")
        fake_pack = os.path.join(work, "packs", "agent-infrastructure")
        os.makedirs(fake_pack)
        shutil.copy(SYNC, fake_pack)
        open(os.path.join(fake_pack, "manifest.txt"), "w", encoding="utf-8").write(
            "free-skills/foo\n")
        open(os.path.join(fake_pack, "SOURCES.md"), "w", encoding="utf-8").write(
            "# t\n\n<!-- PINS:BEGIN — generated by sync-upstream.sh, do not hand-edit -->\nx\n<!-- PINS:END -->\n")
        sync = os.path.join(fake_pack, "sync-upstream.sh")
        p = subprocess.run(["bash", sync], capture_output=True, text=True)
        check("hermetic sync writes pins", p.returncode == 0, p.stderr)
        p = subprocess.run(["bash", sync, "--check"], capture_output=True, text=True)
        check("hermetic sync --check green after sync", p.returncode == 0, p.stdout + p.stderr)
        with open(os.path.join(canon, "SKILL.md"), "a", encoding="utf-8") as fh:
            fh.write("\nEdited canon.\n")
        p = subprocess.run(["bash", sync, "--check"], capture_output=True, text=True)
        check("sync --check goes red when canon changes", p.returncode == 1, p.stdout)
        check("drifted skill is named", "foo" in p.stdout, p.stdout)


# --------------------------------------------------------------------------
if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        print(f"{t.__name__}:")
        t()
    print()
    if failures:
        print(f"{len(failures)} FAILED")
        raise SystemExit(1)
    print("all checks passed")
