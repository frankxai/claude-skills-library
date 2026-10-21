#!/usr/bin/env python3
"""Tests for agent-lint.py.

    python3 packs/agent-hygiene/tests/test_agent_lint.py

Zero dependencies. Each test writes a small repo under a temp dir and runs the
linter as a subprocess, the way CI and a human do. The load-bearing ones:
test_registry_files_are_skipped (a registry inside an agent directory is not an
agent, and failing it would teach people to ignore the linter) and
test_changed_mode_is_a_ratchet (existing debt must never block a PR that did
not touch it).
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
LINT = os.path.join(PACK, "ci", "agent-lint.py")
LIB = os.path.dirname(os.path.dirname(PACK))

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def lint(cwd: str, *args: str):
    p = subprocess.run([sys.executable, LINT, *args], cwd=cwd, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


def repo(files: dict[str, str]) -> str:
    d = tempfile.mkdtemp()
    subprocess.run(["git", "-C", d, "init", "-q"], check=True)
    for rel, body in files.items():
        p = os.path.join(d, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8", newline="") as fh:
            fh.write(body)
    return d


GOOD = """---
name: blue-team
description: Reviews a proposed architecture for the failure modes the author did not list. Use when the user says "red-team this design" or before an ADR is accepted.
model: opus
tools: Read, Grep
---

## Purpose
Return the ranked list of ways the design fails.

## Procedure
1. Read the ADR.
2. List assumptions.

## Stop conditions
Does not propose the fix. Does not edit the ADR. Never runs on an empty ADR.

## Done means
The review file exists and `npm run artifacts` exits 0 (the test passes).
"""

BAD = """---
name: Content Strategist
description: Helps with content.
---
# Strategist
Our world-class, cutting-edge strategist will seamlessly delve into your needs.
"""


def test_good_file_is_clean() -> None:
    d = repo({".claude/agents/blue-team.md": GOOD})
    code, out = lint(d, ".claude/agents")
    check("good agent file: exit 0", code == 0, out)
    check("good agent file: 0 errors 0 warnings", "1 files, 0 errors, 0 warnings" in out, out)
    shutil.rmtree(d)


def test_bad_file_fails_with_named_checks() -> None:
    d = repo({".claude/agents/content-strategist.md": BAD})
    code, out = lint(d, ".claude/agents")
    check("bad agent file: exit 1", code == 1)
    for want in ("E4", "W1", "W2", "W3", "W5", "W6", "W7"):
        check(f"bad agent file: reports {want}", want in out, out)
    check("E4 names the phrases", "world-class" in out and "seamless" in out and "delve" in out)
    shutil.rmtree(d)


def test_missing_frontmatter_is_an_error() -> None:
    d = repo({".claude/agents/guardian.md": "# Guardian\n**Gate**: Foundation\n"})
    code, out = lint(d, ".claude/agents")
    check("no frontmatter: E1", code == 1 and "E1" in out, out)
    shutil.rmtree(d)


def test_registry_files_are_skipped() -> None:
    d = repo({
        "agents/AGENT_REGISTRY.md": "# Registry\nno frontmatter here\n",
        "agents/README.md": "# About\n",
        ".claude/agents/CLAUDE.md": "# contract\n",
        "agents/real.md": GOOD.replace("blue-team", "real"),
    })
    code, out = lint(d, "agents", ".claude/agents")
    check("registry, README, CLAUDE.md inside agent dirs: skipped", code == 0 and "1 files" in out, out)
    shutil.rmtree(d)


def test_eval_inputs_are_skipped() -> None:
    """Agent OS keeps eval cases under evals/agents/<id>/: prompts, graders,
    and a results table. AGENT_DIR_RE matches that agents/ segment, so without
    the evals/ rule every eval file failed E1-E3 as if it were an agent."""
    d = repo({
        "evals/agents/worker-x/case-a/prompt.md": "---\nmax_turns: 15\n---\n\nUse the worker-x subagent.\n",
        "evals/agents/worker-x/case-a/graders/criterion-1.md": "---\ntype: llm\nweight: 1\n---\n\nOpens a screenshot.\n",
        "evals/agents/RESULTS.md": "# Eval results\n",
        "agents/real.md": GOOD.replace("blue-team", "real"),
    })
    code, out = lint(d, "evals", "agents")
    check("eval prompts, graders, results under evals/: skipped", code == 0 and "1 files" in out, out)
    code, out = lint(d, "--changed")
    check("eval files are not linted by the --changed ratchet", code == 0 and "1 files" in out, out)
    shutil.rmtree(d)


def test_sis_identity_card_shape() -> None:
    """A harness-agnostic card (no model, no tools) is not nagged about model,
    but a missing description is still an error: it is the routing text."""
    card = ("---\nname: starlight-sage\ntier: core\ndomain: memory\nvoice: architect\n---\n"
            "## Identity\nKeeps the vaults.\n## Activation Triggers\nWhen memory is asked for.\n"
            "## Reasoning Protocol\n1. Recall.\n## Quality Gates\nEvery write passes the vault test.\n"
            "## What this seat does NOT do\n- Does not write canon.\n- Never deletes a vault.\n- Does not route money.\n")
    d = repo({"agents/starlight-sage.md": card})
    code, out = lint(d, "agents")
    check("identity card: E3 missing description", code == 1 and "E3" in out, out)
    check("identity card: no W3 model nag", "W3" not in out, out)
    d2 = repo({"agents/starlight-sage.md": card.replace("tier: core", "tier: core\ndescription: Keeps the six vaults current. Use when a session needs prior context or must record a decision.")})
    code2, out2 = lint(d2, "agents")
    check("identity card with description: clean", code2 == 0 and "0 errors, 0 warnings" in out2, out2)
    shutil.rmtree(d); shutil.rmtree(d2)


def test_dated_model_id_is_an_error() -> None:
    d = repo({".claude/agents/x.md": GOOD.replace("blue-team", "x").replace("model: opus", "model: claude-3-5-sonnet-20241022")})
    code, out = lint(d, ".claude/agents")
    check("dated model id: E5", code == 1 and "E5" in out, out)
    shutil.rmtree(d)


def test_tools_formats_all_parse() -> None:
    for form in ("tools: Read, Grep", "tools: [Read, Grep]", "tools:\n  - Read\n  - Grep"):
        d = repo({".claude/agents/blue-team.md": GOOD.replace("tools: Read, Grep", form)})
        code, out = lint(d, ".claude/agents")
        check(f"tools form parses: {form.splitlines()[0]!r}", code == 0 and "0 warnings" in out, out)
        shutil.rmtree(d)


def test_task_declared_without_dispatch_warns() -> None:
    d = repo({".claude/agents/blue-team.md": GOOD.replace("tools: Read, Grep", "tools: Read, Task")})
    _, out = lint(d, ".claude/agents")
    check("Task declared, never dispatched: W4", "W4" in out, out)
    shutil.rmtree(d)


def test_canon_leak_only_outside_arcanea() -> None:
    leaky = GOOD.replace("Read the ADR.", "Ask Shinkami and the Luminor council.")
    d = repo({".claude/agents/blue-team.md": leaky})
    _, out = lint(d, ".claude/agents")
    check("Arcanea canon in a non-Arcanea repo: W8", "W8" in out, out)
    shutil.rmtree(d)
    d = repo({".claude/agents/arcanea-blue-team.md": leaky.replace("name: blue-team", "name: arcanea-blue-team")})
    _, out = lint(d, ".claude/agents")
    check("same text under an arcanea- name: no W8", "W8" not in out, out)
    shutil.rmtree(d)
    d = repo({".claude/agents/blue-team.md": GOOD.replace("Read the ADR.", "Check the quality gates and the voice guardian.")})
    _, out = lint(d, ".claude/agents")
    check("'quality gates' and 'guardian' as plain English: no W8", "W8" not in out, out)
    shutil.rmtree(d)


def test_skill_files() -> None:
    skill = ("---\nname: my-skill\ndescription: Does one thing. Use when asked to do the thing.\n---\n# My skill\n"
             "This seamless skill is world-class.\n")
    d = repo({".claude/skills/my-skill/SKILL.md": skill})
    code, out = lint(d, ".claude/skills")
    check("skill with slop: warning, not error (vendored skills exist)", code == 0 and "W-E4" in out, out)
    d2 = repo({".claude/skills/My_Skill/SKILL.md": skill.replace("name: my-skill", "name: My_Skill")})
    code2, out2 = lint(d2, ".claude/skills")
    check("skill name not hyphen-case: E7", code2 == 1 and "E7" in out2, out2)
    shutil.rmtree(d); shutil.rmtree(d2)


def test_crlf_warns_and_still_parses() -> None:
    d = repo({".claude/agents/blue-team.md": GOOD.replace("\n", "\r\n")})
    code, out = lint(d, ".claude/agents")
    check("CRLF file: parses, W10 only", code == 0 and "W10" in out and "0 errors" in out, out)
    shutil.rmtree(d)


def test_long_body() -> None:
    d = repo({".claude/agents/blue-team.md": GOOD + ("filler line\n" * 420)})
    _, out = lint(d, ".claude/agents")
    check("420 extra lines: W9", "W9" in out, out)
    d2 = repo({".claude/agents/blue-team.md": GOOD + ("filler line\n" * 820)})
    code, out2 = lint(d2, ".claude/agents")
    check("820 extra lines: E6", code == 1 and "E6" in out2, out2)
    shutil.rmtree(d); shutil.rmtree(d2)


def test_changed_mode_is_a_ratchet() -> None:
    d = repo({".claude/agents/old.md": BAD.replace("Content Strategist", "old")})
    subprocess.run(["git", "-C", d, "add", "-A"], check=True)
    subprocess.run(["git", "-C", d, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "base"], check=True)
    subprocess.run(["git", "-C", d, "branch", "-M", "main"], check=True)
    subprocess.run(["git", "-C", d, "checkout", "-qb", "feature"], check=True)
    with open(os.path.join(d, ".claude/agents/new.md"), "w") as fh:
        fh.write(GOOD.replace("blue-team", "new"))
    code, out = lint(d, "--changed", "--base", "main")
    check("--changed: only the new file is linted", "1 files" in out and "[changed only]" in out, out)
    check("--changed: old debt does not fail the branch", code == 0, out)
    code_all, out_all = lint(d, "--all")
    check("--all: old debt is still reported", code_all == 1 and "2 files" in out_all, out_all)
    shutil.rmtree(d)


def test_strict_and_json() -> None:
    d = repo({".claude/agents/blue-team.md": GOOD.replace("model: opus\n", "")})
    code, out = lint(d, ".claude/agents")
    check("missing model is a warning: exit 0", code == 0 and "W3" in out)
    code_s, _ = lint(d, ".claude/agents", "--strict")
    check("--strict: warning fails", code_s == 1)
    _, out_j = lint(d, ".claude/agents", "--json")
    first = json.loads(out_j.splitlines()[0])
    check("--json: one object per file with errors and warnings", first["file"].endswith("blue-team.md") and "warnings" in first)
    shutil.rmtree(d)


def test_library_canonical_skill_is_clean() -> None:
    code, out = lint(LIB, "free-skills/agent-hygiene")
    check("the pack's own skill passes its own linter", code == 0 and "0 errors, 0 warnings" in out, out)


if __name__ == "__main__":
    for fn in [v for k, v in sorted(globals().items()) if k.startswith("test_")]:
        print(fn.__name__)
        fn()
    print()
    if failures:
        print(f"{len(failures)} FAILED: {failures}")
        sys.exit(1)
    print("all linter tests passed")
