#!/usr/bin/env python3
"""Shared helpers for the queen-ops hooks. Zero dependencies.

The pack is inert until a repo is ARMED: `.starlight/queen/active.json` exists
under the project directory. Arming is a deliberate act (the queen-ops skill
says when); it turns the gates on, it never satisfies one.

Layout under <project>/.starlight/queen/ (gitignored by install.sh):
  active.json                     the arm switch; may carry {"budget": {"microUsd": n}}
  briefs/<task_id>.json           one Brief per dispatched task (starlight.queen-brief.v1)
  receipts/<task_id>.verify.json  the independent verifier's completion receipt
  receipts/<task_id>.taste.json   the taste / design receipt
  ledger.jsonl                    optional: signed starlight.run-receipt.v1 envelopes
"""
from __future__ import annotations

import json
import os
import re
import sys
import tempfile

BRIEF_SCHEMA = "starlight.queen-brief.v1"
GLOB = re.compile(r"[*?\[\]{}]")
SHELL_META = re.compile(r"[;&|`$<>]")
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)


def project_dir() -> str:
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()


def queen_dir() -> str:
    return os.path.join(project_dir(), ".starlight", "queen")


def armed() -> bool:
    return os.path.isfile(os.path.join(queen_dir(), "active.json"))


def read_json(path: str):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return None


def payload() -> dict:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


def safe_id(value) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "", str(value or ""))[:96]


def brief_path(task_id: str) -> str:
    return os.path.join(queen_dir(), "briefs", f"{safe_id(task_id)}.json")


def receipt_path(task_id: str, kind: str) -> str:
    return os.path.join(queen_dir(), "receipts", f"{safe_id(task_id)}.{kind}.json")


# ---------------------------------------------------------------- state (per session)
def state_path(session_id) -> str:
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[:64] or "nosession"
    return os.path.join(tempfile.gettempdir(), f"queen-ops-{safe}.json")


def read_state(path: str) -> dict:
    try:
        fd = os.open(path, os.O_RDONLY | NOFOLLOW)
    except OSError:
        return {}
    try:
        with os.fdopen(fd, "r") as fh:
            data = json.load(fh)
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


def write_state(path: str, state: dict) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | NOFOLLOW, 0o600)
    with os.fdopen(fd, "w") as fh:
        json.dump(state, fh)


# ---------------------------------------------------------------- brief admission
def _nonempty(v) -> bool:
    return isinstance(v, str) and bool(v.strip())


def _str_list(v) -> bool:
    return isinstance(v, list) and all(_nonempty(x) for x in v)


def _pos_int(v) -> bool:
    return isinstance(v, int) and not isinstance(v, bool) and v > 0


def verifier_is_independent(maker, verifier) -> bool:
    if not isinstance(maker, dict) or not isinstance(verifier, dict):
        return False
    if not _nonempty(maker.get("id")) or not _nonempty(verifier.get("id")):
        return False
    if maker["id"] == verifier["id"]:
        return False
    if maker.get("model") and verifier.get("model") and maker["model"] == verifier["model"]:
        return False
    return True


def brief_problems(brief) -> list[str]:
    """Python port of briefProblems() from @starlight-intelligence/queen (brief.ts).
    Same rules, same wording where it matters. Empty list = dispatchable."""
    if not isinstance(brief, dict):
        return ["brief is not an object"]
    p: list[str] = []
    if brief.get("schema") != BRIEF_SCHEMA:
        p.append(f"schema is {json.dumps(brief.get('schema'))}, expected {BRIEF_SCHEMA}")
    if not _nonempty(brief.get("id")):
        p.append("id is missing")
    if not _nonempty(brief.get("objective")):
        p.append("objective is missing")
    if not (_str_list(brief.get("acceptance")) and brief["acceptance"]):
        p.append("acceptance needs at least one checkable statement")
    if not (isinstance(brief.get("tools"), list) and all(_nonempty(x) for x in brief["tools"])):
        p.append("tools must be a list of tool names (empty is allowed)")
    if not (_str_list(brief.get("boundaries")) and brief["boundaries"]):
        p.append("boundaries needs at least one line")
    out = brief.get("output")
    if not isinstance(out, dict):
        p.append("output contract is missing")
    else:
        if out.get("format") not in ("markdown", "json", "diff", "files", "receipt"):
            p.append(f"output.format {json.dumps(out.get('format'))} is not known")
        if not _pos_int(out.get("maxBytes")):
            p.append("output.maxBytes must be a positive integer")
        if out.get("format") == "json" and not _nonempty(out.get("schema")):
            p.append("output.schema is required for json output")
    bud = brief.get("budget")
    if not isinstance(bud, dict):
        p.append("budget is missing")
    else:
        if not _pos_int(bud.get("microUsd")):
            p.append("budget.microUsd must be a positive integer")
        if not _pos_int(bud.get("wallTimeMs")):
            p.append("budget.wallTimeMs must be a positive integer")
    for label in ("maker", "verifier"):
        actor = brief.get(label)
        if not isinstance(actor, dict) or not _nonempty(actor.get("id")):
            p.append(f"{label}.id is missing")
    if not any(x.startswith(("maker", "verifier")) for x in p):
        if not verifier_is_independent(brief.get("maker"), brief.get("verifier")):
            p.append("verifier is not independent of maker (same id or same model)")
    checks = brief.get("allowedChecks")
    if not (isinstance(checks, list) and all(_nonempty(x) for x in checks)):
        p.append("allowedChecks must be a list of exact command strings (empty is allowed)")
    else:
        for c in checks:
            if GLOB.search(c):
                p.append(f"allowedChecks entry is a pattern, not a command: {json.dumps(c)}")
            if SHELL_META.search(c):
                p.append(f"allowedChecks entry carries shell metacharacters: {json.dumps(c)}")
    return p


# ---------------------------------------------------------------- receipts
def verify_receipt_problems(receipt, brief=None) -> list[str]:
    """A verify receipt credits a task only when an independent verifier re-ran
    checks and every re-run exited 0. The shape mirrors VerifyOutcome in
    verify-contract.ts plus who verified."""
    if not isinstance(receipt, dict):
        return ["verify receipt is missing or not an object"]
    p: list[str] = []
    if receipt.get("credited") is not True:
        p.append("verify receipt does not credit the task (credited is not true)")
    reruns = receipt.get("reruns")
    if not (isinstance(reruns, list) and reruns):
        p.append("verify receipt re-ran no checks; a receipt without re-runs is a claim")
    else:
        for r in reruns:
            if not isinstance(r, dict) or r.get("exitCode") != 0 or not _nonempty(r.get("command")):
                p.append("verify receipt lists a re-run that did not exit 0")
                break
    verifier = receipt.get("verifier")
    if not isinstance(verifier, dict) or not _nonempty(verifier.get("id")):
        p.append("verify receipt names no verifier")
    elif isinstance(brief, dict):
        if not verifier_is_independent(brief.get("maker"), verifier):
            p.append("verify receipt was issued by the maker (or the maker's model); Maker ≠ Checker")
        allowed = brief.get("allowedChecks") if isinstance(brief.get("allowedChecks"), list) else []
        for r in reruns or []:
            if isinstance(r, dict) and r.get("command") not in allowed:
                p.append(f"verify receipt re-ran a check outside the brief's allowedChecks: {json.dumps(r.get('command'))}")
                break
    return p


def taste_receipt_problems(receipt) -> list[str]:
    if not isinstance(receipt, dict):
        return ["taste receipt is missing or not an object"]
    p: list[str] = []
    if receipt.get("verdict") not in ("pass", "ship"):
        p.append(f"taste receipt verdict is {json.dumps(receipt.get('verdict'))}, not pass/ship")
    if not _nonempty(receipt.get("pack")):
        p.append("taste receipt names no taste pack (design.md / taste.md / web-release-gate)")
    reviewer = receipt.get("reviewer")
    if not isinstance(reviewer, dict) or not _nonempty(reviewer.get("id")):
        p.append("taste receipt names no reviewer")
    return p


def briefed_task_ids() -> list[str]:
    d = os.path.join(queen_dir(), "briefs")
    try:
        return sorted(f[:-5] for f in os.listdir(d) if f.endswith(".json"))
    except OSError:
        return []


def task_is_credited(task_id: str) -> tuple[bool, list[str]]:
    brief = read_json(brief_path(task_id))
    problems = verify_receipt_problems(read_json(receipt_path(task_id, "verify")), brief)
    problems += taste_receipt_problems(read_json(receipt_path(task_id, "taste")))
    return (not problems, problems)


def emit_context(event: str, text: str) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": event, "additionalContext": text}}))


def refuse(reason: str) -> int:
    """Exit 2: the harness feeds stderr back to the agent and blocks the action."""
    sys.stderr.write(reason.rstrip() + "\n")
    return 2
