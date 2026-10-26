#!/usr/bin/env python3
"""Tests for the agent-hygiene Stop hook.

    python3 packs/agent-hygiene/tests/test_hooks.py

Zero dependencies, no pytest — this has to run anywhere the hook does.

The load-bearing one is test_cited_command_must_have_run: the verification line
is a receipt only if the command it names actually ran. A hook that accepted
any line shaped like `Verified: ...` would be satisfied by prose, which is the
enforcement-that-does-not-enforce failure the web-excellence pack already paid
for once.
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
STOP = os.path.join(PACK, "hooks", "agent-hygiene-stop.py")

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def run_hook(payload: dict, env: dict | None = None):
    e = dict(os.environ)
    e.pop("AGENT_HYGIENE_NO_STOP", None)
    e.update(env or {})
    p = subprocess.run([sys.executable, STOP], input=json.dumps(payload), capture_output=True,
                       text=True, encoding="utf-8", errors="replace", env=e)
    out = p.stdout.strip()
    return (json.loads(out) if out else None), p.returncode


def transcript(entries: list[dict]) -> str:
    """Write a JSONL transcript in the shape Claude Code produces."""
    fd, path = tempfile.mkstemp(suffix=".jsonl")
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        for e in entries:
            fh.write(json.dumps(e) + "\n")
    return path


def bash_call(cmd: str, tid: str = "t1") -> dict:
    return {"type": "assistant", "message": {"role": "assistant", "content": [
        {"type": "tool_use", "id": tid, "name": "Bash", "input": {"command": cmd}}]}}


def assistant(text: str) -> dict:
    return {"type": "assistant", "message": {"role": "assistant", "content": [{"type": "text", "text": text}]}}


def dirty_repo() -> str:
    d = tempfile.mkdtemp()
    subprocess.run(["git", "-C", d, "init", "-q"], check=True)
    with open(os.path.join(d, "agent.md"), "w") as fh:
        fh.write("---\nname: x\n---\n")
    return d


def clean_repo() -> str:
    d = dirty_repo()
    subprocess.run(["git", "-C", d, "add", "-A"], check=True)
    subprocess.run(["git", "-C", d, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"], check=True)
    return d


def fresh_sid(tag: str) -> str:
    sid = f"ah-{tag}-{os.getpid()}"
    try:
        os.remove(os.path.join(tempfile.gettempdir(), f"agent-hygiene-{sid}.json"))
    except OSError:
        pass
    return sid


def test_empty_payload_is_silent() -> None:
    out, code = run_hook({})
    check("empty payload: exit 0, no decision", code == 0 and out is None)


def test_clean_tree_no_commit_allows() -> None:
    repo = clean_repo()
    t = transcript([assistant("Here is the answer. No files changed.")])
    out, _ = run_hook({"session_id": fresh_sid("clean"), "transcript_path": t, "cwd": repo})
    check("clean tree, no commit, no line: allowed", out is None)
    shutil.rmtree(repo)


def test_dirty_tree_without_line_blocks_once() -> None:
    repo = dirty_repo()
    sid = fresh_sid("noline")
    t = transcript([bash_call("python3 lint.py"), assistant("Done. I changed agent.md.")])
    first, _ = run_hook({"session_id": sid, "transcript_path": t, "cwd": repo})
    check("dirty tree, no line: blocks", first is not None and first.get("decision") == "block")
    check("block names the missing line", first is not None and "Verified:" in first.get("reason", ""))
    second, _ = run_hook({"session_id": sid, "transcript_path": t, "cwd": repo})
    check("same change set: never blocks twice", second is None)
    shutil.rmtree(repo)


def test_stop_hook_active_never_chains() -> None:
    repo = dirty_repo()
    t = transcript([assistant("Done.")])
    out, _ = run_hook({"session_id": fresh_sid("active"), "transcript_path": t, "cwd": repo, "stop_hook_active": True})
    check("stop_hook_active: allowed regardless", out is None)
    shutil.rmtree(repo)


def test_verified_line_with_real_command_allows() -> None:
    repo = dirty_repo()
    t = transcript([
        bash_call("cd /work && python3 scripts/validate_skills.py && python3 scripts/check_counts.py"),
        assistant("Changed two files.\n\nVerified: python3 scripts/validate_skills.py → 115 files, 0 errors"),
    ])
    out, _ = run_hook({"session_id": fresh_sid("real"), "transcript_path": t, "cwd": repo})
    check("Verified: line naming a command that ran: allowed", out is None)
    shutil.rmtree(repo)


def test_cited_command_must_have_run() -> None:
    """THE regression test. Prose shaped like a receipt is not a receipt."""
    repo = dirty_repo()
    sid = fresh_sid("fake")
    t = transcript([
        bash_call("ls -la"),
        assistant("All good.\n\nVerified: pnpm run type-check → exit 0"),
    ])
    out, _ = run_hook({"session_id": sid, "transcript_path": t, "cwd": repo})
    check("Verified: line citing a command that never ran: blocked",
          out is not None and out.get("decision") == "block")
    check("block says which command was cited", out is not None and "pnpm run type-check" in out.get("reason", ""))
    shutil.rmtree(repo)


def test_skill_text_cannot_satisfy() -> None:
    """A tool RESULT (reading SKILL.md, which contains example commands) must not
    count as the command having run; only a Bash tool_use input counts."""
    repo = dirty_repo()
    t = transcript([
        {"type": "user", "message": {"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": "r1",
             "content": "Verified: python3 scripts/validate_skills.py → 115 files, 0 errors"}]}},
        assistant("Verified: python3 scripts/validate_skills.py → 115 files, 0 errors"),
    ])
    out, _ = run_hook({"session_id": fresh_sid("skilltext"), "transcript_path": t, "cwd": repo})
    check("command seen only in a tool result: still blocked", out is not None and out.get("decision") == "block")
    shutil.rmtree(repo)


def test_unverified_is_honest_and_allowed() -> None:
    repo = dirty_repo()
    t = transcript([assistant("Changed the file.\n\nUnverified: pnpm test, no node in this container")])
    out, _ = run_hook({"session_id": fresh_sid("unver"), "transcript_path": t, "cwd": repo})
    check("Unverified: line: allowed", out is None)
    shutil.rmtree(repo)


def test_commit_in_session_counts_as_change() -> None:
    repo = clean_repo()
    t = transcript([bash_call("git add -A && git commit -m 'x'"), assistant("Committed.")])
    out, _ = run_hook({"session_id": fresh_sid("commit"), "transcript_path": t, "cwd": repo})
    check("clean tree but a commit was made here, no line: blocked", out is not None and out.get("decision") == "block")
    shutil.rmtree(repo)


def test_new_change_set_rearms() -> None:
    repo = dirty_repo()
    sid = fresh_sid("rearm")
    t = transcript([assistant("Done.")])
    run_hook({"session_id": sid, "transcript_path": t, "cwd": repo})
    with open(os.path.join(repo, "second.md"), "w") as fh:
        fh.write("x")
    out, _ = run_hook({"session_id": sid, "transcript_path": t, "cwd": repo})
    check("a new file after the block: re-arms once", out is not None and out.get("decision") == "block")
    shutil.rmtree(repo)


def test_subagent_commands_count() -> None:
    repo = dirty_repo()
    main = transcript([assistant("Verified: python3 lint.py --all → 3 files, 0 errors")])
    sub_dir = os.path.join(os.path.splitext(main)[0], "subagents")
    os.makedirs(sub_dir)
    with open(os.path.join(sub_dir, "a.jsonl"), "w") as fh:
        fh.write(json.dumps(bash_call("python3 lint.py --all")) + "\n")
    out, _ = run_hook({"session_id": fresh_sid("sub"), "transcript_path": main, "cwd": repo})
    check("command run by a subagent: counts", out is None)
    shutil.rmtree(repo)


def test_opt_out() -> None:
    repo = dirty_repo()
    t = transcript([assistant("Done.")])
    out, _ = run_hook({"session_id": fresh_sid("optout"), "transcript_path": t, "cwd": repo}, {"AGENT_HYGIENE_NO_STOP": "1"})
    check("AGENT_HYGIENE_NO_STOP=1: silent", out is None)
    shutil.rmtree(repo)


if __name__ == "__main__":
    for fn in [v for k, v in sorted(globals().items()) if k.startswith("test_")]:
        print(fn.__name__)
        fn()
    print()
    if failures:
        print(f"{len(failures)} FAILED: {failures}")
        sys.exit(1)
    print("all hook tests passed")
