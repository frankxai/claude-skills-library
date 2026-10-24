#!/usr/bin/env python3
"""SessionStart hook — say whether this repo runs a Queen session, and what that means.

Armed: every task is a dispatch; a task needs a Brief before it is created, an
independent verify receipt and a taste receipt before it is completed, and the
turn cannot end with briefed tasks uncredited. Unarmed: the pack is inert and
says so in one line, so nobody mistakes an installed hook for an enforced one.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _queen_ops_common import armed, briefed_task_ids, emit_context, payload, queen_dir, task_is_credited  # noqa: E402

ARMED_NOTE = """\
QUEEN SESSION ARMED (.starlight/queen/active.json present) — queen-ops hooks enforce:
  • A task is created only from a complete Brief at .starlight/queen/briefs/<task_id>.json
    (starlight.queen-brief.v1: objective, acceptance, output, tools, boundaries, budget,
    maker, independent verifier, exact allowedChecks). Incomplete → TaskCreate is refused.
  • A task completes only with .starlight/queen/receipts/<task_id>.verify.json issued by the
    verifier named in the Brief (credited:true, re-runs that exited 0, commands from
    allowedChecks) AND <task_id>.taste.json (verdict pass/ship, pack, reviewer).
  • Human-gate actions (move funds, bulk send, key rotation, force-push main, emergency
    governance) are denied at the tool call. Prepare them; a person commits them.
  • The turn cannot end while a briefed task has no receipts (blocks once, then says so).
Read the `queen-ops` skill for the file shapes. Repo contracts (design.md / taste.md) win.\
"""


def main() -> int:
    payload()  # drain stdin; nothing in it changes this note
    if not armed():
        emit_context("SessionStart", f"queen-ops installed, not armed ({os.path.relpath(queen_dir(), os.getcwd())}/active.json absent): hooks are inert in this session.")
        return 0
    ids = briefed_task_ids()
    open_ids = [t for t in ids if not task_is_credited(t)[0]]
    status = f"\nOpen briefs without receipts: {', '.join(open_ids) if open_ids else 'none'} ({len(ids)} briefed)."
    emit_context("SessionStart", ARMED_NOTE + status)
    return 0


if __name__ == "__main__":
    sys.exit(main())
