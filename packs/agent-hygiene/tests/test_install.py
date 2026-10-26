#!/usr/bin/env python3
"""Tests for the agent-hygiene installer.

    python3 packs/agent-hygiene/tests/test_install.py

Zero dependencies. The load-bearing ones: test_second_run_changes_nothing
(idempotency is what makes "re-run install.sh" a safe upgrade) and
test_settings_merge_preserves_other_hooks (the pack lands in repos that already
run estate-guard and web-excellence hooks; clobbering them would remove gates).
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
LIB = os.path.dirname(os.path.dirname(PACK))
INSTALL = os.path.join(PACK, "install.sh")

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def tree_hash(root: str) -> str:
    h = hashlib.sha256()
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d != ".git")
        for fn in sorted(filenames):
            p = os.path.join(dirpath, fn)
            h.update(os.path.relpath(p, root).encode())
            h.update(open(p, "rb").read())
    return h.hexdigest()


def fresh_repo() -> str:
    d = tempfile.mkdtemp()
    subprocess.run(["git", "-C", d, "init", "-q"], check=True)
    return d


def install(target: str, *flags: str) -> subprocess.CompletedProcess:
    return subprocess.run(["bash", INSTALL, target, *flags], capture_output=True, text=True)


def test_manifest_resolves_and_is_spec_valid() -> None:
    entries = [l.strip() for l in open(os.path.join(PACK, "manifest.txt")) if l.strip() and not l.startswith("#")]
    check("manifest has at least one entry", bool(entries))
    for e in entries:
        p = os.path.join(LIB, e, "SKILL.md")
        check(f"manifest entry resolves: {e}", os.path.isfile(p))
    r = subprocess.run([sys.executable, os.path.join(LIB, "scripts", "validate_skills.py"), *entries],
                       cwd=LIB, capture_output=True, text=True)
    check("manifest skills pass validate_skills.py", r.returncode == 0, r.stdout[-300:])


def test_dry_run_writes_nothing() -> None:
    d = fresh_repo()
    before = tree_hash(d)
    r = install(d, "--dry-run")
    check("dry run exits 0", r.returncode == 0, r.stderr)
    check("dry run writes nothing", tree_hash(d) == before)
    check("dry run says what it would do", "would:" in r.stdout)
    shutil.rmtree(d)


def test_full_install_lays_down_every_piece() -> None:
    d = fresh_repo()
    r = install(d)
    check("install exits 0", r.returncode == 0, r.stderr)
    for rel in (".claude/skills/agent-hygiene/SKILL.md",
                ".claude/skills/agent-hygiene/references/agent-file-contract.md",
                ".claude/hooks/agent-hygiene-stop.py",
                ".claude/ci/agent-lint.py",
                ".github/workflows/agent-hygiene.yml",
                ".claude/settings.json"):
        check(f"installed: {rel}", os.path.isfile(os.path.join(d, rel)))
    canon = os.path.join(LIB, "free-skills", "agent-hygiene")
    check("installed skill is byte-identical to canon",
          tree_hash(canon) == tree_hash(os.path.join(d, ".claude/skills/agent-hygiene")))
    settings = json.load(open(os.path.join(d, ".claude/settings.json")))
    cmds = [h["command"] for e in settings["hooks"]["Stop"] for h in e["hooks"]]
    check("Stop hook wired once", sum("agent-hygiene-stop.py" in c for c in cmds) == 1, str(cmds))
    gi = open(os.path.join(d, ".gitignore")).read()
    check(".replaced/ gitignored", ".claude/skills/.replaced/" in gi)
    # the installed pieces work where they land
    smoke = subprocess.run([sys.executable, os.path.join(d, ".claude/hooks/agent-hygiene-stop.py")],
                           input="{}", capture_output=True, text=True)
    check("installed hook exits clean on {}", smoke.returncode == 0 and not smoke.stdout.strip())
    lint = subprocess.run([sys.executable, os.path.join(d, ".claude/ci/agent-lint.py"), "--all"],
                          cwd=d, capture_output=True, text=True)
    check("installed linter runs and lints the installed skill", lint.returncode == 0 and "1 files" in lint.stdout, lint.stdout)
    shutil.rmtree(d)


def test_second_run_changes_nothing() -> None:
    d = fresh_repo()
    install(d)
    first = tree_hash(d)
    r = install(d)
    check("second run exits 0", r.returncode == 0, r.stderr)
    check("second run changes nothing", tree_hash(d) == first)
    check("second run reports the skill as canonical", "already canonical" in r.stdout)
    shutil.rmtree(d)


def test_settings_merge_preserves_other_hooks() -> None:
    d = fresh_repo()
    os.makedirs(os.path.join(d, ".claude"))
    existing = {"permissions": {"allow": ["Bash(ls:*)"]}, "hooks": {
        "PreToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "python3 .claude/hooks/estate-guard-gate.py"}]}],
        "Stop": [{"hooks": [{"type": "command", "command": "python3 \"${CLAUDE_PROJECT_DIR}/.claude/hooks/web-excellence-stop.py\"", "timeout": 15}]}],
    }}
    json.dump(existing, open(os.path.join(d, ".claude/settings.json"), "w"), indent=2)
    install(d)
    after = json.load(open(os.path.join(d, ".claude/settings.json")))
    check("permissions block untouched", after.get("permissions") == existing["permissions"])
    check("estate-guard PreToolUse hook untouched", after["hooks"]["PreToolUse"] == existing["hooks"]["PreToolUse"])
    stop_cmds = [h["command"] for e in after["hooks"]["Stop"] for h in e["hooks"]]
    check("web-excellence Stop hook kept", any("web-excellence-stop.py" in c for c in stop_cmds))
    check("agent-hygiene Stop hook added once", sum("agent-hygiene-stop.py" in c for c in stop_cmds) == 1)
    shutil.rmtree(d)


def test_diverged_copy_is_preserved() -> None:
    d = fresh_repo()
    install(d)
    local = os.path.join(d, ".claude/skills/agent-hygiene/SKILL.md")
    with open(local, "a") as fh:
        fh.write("\nlocal edit\n")
    r = install(d)
    check("diverged copy is named", "DIVERGED" in r.stdout)
    check("diverged copy set aside", os.path.isfile(os.path.join(d, ".claude/skills/.replaced/agent-hygiene/SKILL.md")))
    check("canon restored", "local edit" not in open(local).read())
    shutil.rmtree(d)


def test_existing_workflow_is_kept() -> None:
    d = fresh_repo()
    wf = os.path.join(d, ".github/workflows/agent-hygiene.yml")
    os.makedirs(os.path.dirname(wf))
    open(wf, "w").write("name: tuned by the repo\n")
    r = install(d)
    check("a repo-tuned workflow is not overwritten", open(wf).read() == "name: tuned by the repo\n")
    check("and the installer says so", "keep" in r.stdout)
    shutil.rmtree(d)


def test_bad_flag_and_missing_target() -> None:
    d = fresh_repo()
    check("unknown flag exits 2", install(d, "--bogus").returncode == 2)
    check("missing target exits 2", subprocess.run(["bash", INSTALL], capture_output=True).returncode == 2)
    shutil.rmtree(d)


if __name__ == "__main__":
    for fn in [v for k, v in sorted(globals().items()) if k.startswith("test_")]:
        print(fn.__name__)
        fn()
    print()
    if failures:
        print(f"{len(failures)} FAILED: {failures}")
        sys.exit(1)
    print("all installer tests passed")
