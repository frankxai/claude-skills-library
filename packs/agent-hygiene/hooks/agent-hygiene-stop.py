#!/usr/bin/env python3
"""Stop hook — a turn that changed files ends with a verification line that is true.

The agent-hygiene contract says every hand-back after a change ends with

    Verified: <command that ran> → <what it returned>

or, honestly, `Unverified: <what you would have run and why you could not>`.
This hook enforces the half a hook can enforce. At the moment a turn would end:

  1. If nothing changed in this working tree (no uncommitted change, no commit
     made from this session), allow. A pure answer needs no receipt.
  2. Otherwise read the last assistant message. If it has no Verified/Unverified
     line, block once and say what is missing.
  3. If it has a `Verified:` line, the command it names must appear as the input
     of a Bash call somewhere in this session's transcript (subagents included).
     A line citing a command that never ran is blocked once with that said
     plainly: the point of the line is that it is a receipt, not a sentence.

It blocks AT MOST ONCE per change set. The change set is fingerprinted (the
sorted list of changed paths); a stop after a block on the same set is always
allowed, and `stop_hook_active` is honoured so the hook can never chain.
Opt out with AGENT_HYGIENE_NO_STOP=1.

The web-excellence Stop hook taught the one lesson this file is built on: a
check that can be satisfied by the agent's own prose is a no-op. So the command
is matched against tool-call INPUT, which skill text and file reads never
produce. See tests/test_hooks.py::test_cited_command_must_have_run.

Installed from frankxai/claude-skills-library packs/agent-hygiene; the tests
live there and are not vendored. Edit it upstream.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile

LINE_RE = re.compile(r"^\s*(?:[-*>]\s*)?\**(Verified|Unverified)\**\s*:\s*(.+?)\s*$", re.M)
ARROW_RE = re.compile(r"\s*(?:→|->|=>|⇒|—|:|;|\.\s|$)")
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)


def state_path(session_id: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[:64] or "nosession"
    return os.path.join(tempfile.gettempdir(), f"agent-hygiene-{safe}.json")


def read_state(path: str) -> dict:
    try:
        fd = os.open(path, os.O_RDONLY | NOFOLLOW)
        with os.fdopen(fd, "r") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def write_state(path: str, state: dict) -> None:
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | NOFOLLOW, 0o600)
        with os.fdopen(fd, "w") as fh:
            json.dump(state, fh)
    except OSError:
        pass


def git(cwd: str, *args: str):
    try:
        out = subprocess.run(["git", "-C", cwd, *args], capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout if out.returncode == 0 else None


def dirty_files(cwd: str) -> list:
    out = git(cwd, "status", "--porcelain=v1", "--untracked-files=all")
    if out is None:
        return []
    return sorted(line[3:] for line in out.splitlines() if len(line) > 3)


def transcript_files(path: str) -> list:
    if not path or not os.path.exists(path):
        return []
    files = [path]
    sub = os.path.join(os.path.splitext(path)[0], "subagents")
    try:
        files += sorted(os.path.join(sub, f) for f in os.listdir(sub) if f.endswith(".jsonl"))
    except OSError:
        pass
    return files


def blocks(entry) -> list:
    message = entry.get("message") if isinstance(entry, dict) else None
    content = message.get("content") if isinstance(message, dict) else None
    if isinstance(content, str):
        return [{"type": "text", "text": content}]
    return [b for b in content if isinstance(b, dict)] if isinstance(content, list) else []


def read_transcript(path: str):
    """(bash_commands, committed, last_assistant_text) from the session transcript.

    bash_commands: every Bash tool_use `command` input, main and subagents.
    committed: a `git commit` was issued from this session.
    last_assistant_text: the text of the final assistant message in the MAIN
    transcript (the hand-back the user reads).
    """
    commands, committed, last_text = [], False, ""
    files = transcript_files(path)
    for idx, f in enumerate(files):
        try:
            fh = open(f, "r", encoding="utf-8", errors="ignore")
        except OSError:
            continue
        with fh:
            for line in fh:
                if '"tool_use"' not in line and (idx or '"assistant"' not in line):
                    continue
                try:
                    entry = json.loads(line)
                except ValueError:
                    continue
                texts = []
                for b in blocks(entry):
                    if b.get("type") == "tool_use" and b.get("name") == "Bash":
                        cmd = str((b.get("input") or {}).get("command", ""))
                        commands.append(cmd)
                        if re.search(r"\bgit\b[^\n|;&]*\bcommit\b", cmd):
                            committed = True
                    elif b.get("type") == "text" and idx == 0:
                        texts.append(str(b.get("text", "")))
                role = (entry.get("message") or {}).get("role") if isinstance(entry.get("message"), dict) else entry.get("type")
                if idx == 0 and role == "assistant" and texts:
                    last_text = "\n".join(texts)
    return commands, committed, last_text


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def cited_command(line_body: str) -> str:
    """The command part of `Verified: <cmd> → <outcome>`; the longest prefix
    before an arrow or sentence break. Backticks are decoration, not content."""
    body = line_body.strip().strip("`").strip()
    body = body.replace("`", "")
    m = re.search(r"\s(?:→|->|=>|⇒)\s", body)
    cmd = body[:m.start()] if m else body
    return norm(cmd)


def command_ran(cmd: str, commands: list) -> bool:
    """The cited command, or any `&&`/`;`-separated piece of it, appears inside
    a Bash call that ran. Flags and paths must match; the shell prefix (`cd x &&`)
    around it need not."""
    if not cmd:
        return False
    haystack = [norm(c) for c in commands]
    pieces = [norm(p) for p in re.split(r"\s*(?:&&|;|\|\|)\s*", cmd) if norm(p)]
    for piece in pieces or [cmd]:
        if len(piece) < 6:
            return False
        if not any(piece in h for h in haystack):
            return False
    return True


def main() -> int:
    if os.environ.get("AGENT_HYGIENE_NO_STOP") == "1":
        return 0
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    if payload.get("stop_hook_active"):
        return 0  # never chain
    if not payload.get("transcript_path"):
        return 0  # nothing to judge (a smoke test, or a harness that sends no transcript)

    cwd = payload.get("cwd") or os.getcwd()
    sp = state_path(payload.get("session_id", ""))
    state = read_state(sp)

    commands, committed, last_text = read_transcript(payload.get("transcript_path", ""))
    changed = dirty_files(cwd)
    if not changed and not committed:
        return 0
    fingerprint = {"dirty": changed, "committed": committed}
    if state.get("blocked_for") == fingerprint:
        return 0  # had its one block for this change set

    matches = LINE_RE.findall(last_text)
    reason = None
    if not matches:
        reason = ("agent-hygiene: this turn changed files but the hand-back has no verification line.\n\n"
                  "End the final message with one line in this shape:\n"
                  "  Verified: <the command you ran> → <what it returned, in numbers>\n"
                  "or, if nothing could be run:\n"
                  "  Unverified: <what you would have run and why you could not>\n\n"
                  "The command named must be one that actually ran in this session. "
                  "This check fires once per change set.")
    else:
        kind, body = matches[-1]
        if kind == "Verified":
            cmd = cited_command(body)
            if not command_ran(cmd, commands):
                reason = ("agent-hygiene: the hand-back cites a verification command that did not run in this session.\n\n"
                          f"  Cited: {cmd or '(empty)'}\n\n"
                          "Either run it now and report its real output, or change the line to\n"
                          "  Unverified: <why it was not run>\n"
                          "A Verified: line is a receipt. One that names a command that never ran is "
                          "worse than no line. This check fires once per change set.")

    if reason is None:
        return 0
    state["blocked_for"] = fingerprint
    write_state(sp, state)
    print(json.dumps({"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
