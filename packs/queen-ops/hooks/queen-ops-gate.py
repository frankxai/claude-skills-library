#!/usr/bin/env python3
"""PreToolUse hook — the Queen's human gate, at the tool call.

Matcher: Bash|Edit|Write|MultiEdit

Denies the actions the charter routes to a human (move funds, bulk send, key
rotation, force-push to main, switching governance to emergency), whatever the
session's permission mode says. estate-guard covers the machine hard stops; this
covers the Queen's. Patterns are few and high-precision on purpose: a gate that
fires on noise gets switched off.

Everything else passes. On the first edit or write of an armed session it adds
one reminder: dispatch needs a Brief. The reminder names no receipt marker, so
it can never satisfy a receipt check (see tests).
"""
from __future__ import annotations

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _queen_ops_common import armed, payload, read_state, state_path, write_state  # noqa: E402

HUMAN_GATE = [
    ("move funds", re.compile(r"\b(transfer_funds|payouts?\.create|/v1/(transfers|payouts)|move[-_ ]funds|settle_payment|wire[-_ ]transfer)\b", re.I)),
    ("bulk send", re.compile(r"\b(send[-_ ]blast|broadcasts?\.(send|create)|emails?/batch|sendgrid\.(send|mail)|resend\.batch|campaigns?\.send)\b", re.I)),
    ("key rotation", re.compile(r"\b(rotate[-_ ]?(key|secret|token)s?|secrets?\s+(rotate|set|delete)|api[-_ ]keys?\s+(rotate|revoke))\b", re.I)),
    ("force-push to main", re.compile(r"\bgit\s+push\b[^\n]*(--force|-f\b|\+)[^\n]*\b(main|master)\b|\bgit\s+push\b[^\n]*\b(main|master)\b[^\n]*(--force|-f\b)", re.I)),
    ("emergency governance", re.compile(r"\"governance\"\s*:\s*\"emergency\"|governance\s*=\s*['\"]?emergency", re.I)),
]

REMINDER = """\
QUEEN SESSION — dispatch rule applies to this change.
Before any task is created for another agent: write .starlight/queen/briefs/<task_id>.json
(starlight.queen-brief.v1) with objective, acceptance, output, tools, boundaries, budget,
maker, an independent verifier and exact allowedChecks. Human-gate actions are prepared,
never committed, by an agent.\
"""


def text_of(tool_input: dict) -> str:
    parts = []
    for key in ("command", "content", "new_string", "new_source"):
        v = tool_input.get(key)
        if isinstance(v, str):
            parts.append(v)
    edits = tool_input.get("edits")
    if isinstance(edits, list):
        for e in edits:
            if isinstance(e, dict) and isinstance(e.get("new_string"), str):
                parts.append(e["new_string"])
    return "\n".join(parts)


def main() -> int:
    data = payload()
    if not armed():
        return 0
    tool_input = data.get("tool_input") or {}
    text = text_of(tool_input if isinstance(tool_input, dict) else {})
    for label, pattern in HUMAN_GATE:
        if pattern.search(text):
            print(json.dumps({
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": f"queen-ops human gate: {label}. Agents prepare; a person commits. Write the decision up with evidence and stop.",
                }
            }))
            return 0

    sp = state_path(data.get("session_id", ""))
    state = read_state(sp)
    if state.get("reminded") and os.environ.get("QUEEN_OPS_EVERY_EDIT") != "1":
        return 0
    state["reminded"] = True
    try:
        write_state(sp, state)
    except OSError:
        pass
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": REMINDER}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
