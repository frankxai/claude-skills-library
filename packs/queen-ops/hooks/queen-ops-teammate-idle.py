#!/usr/bin/env python3
"""TeammateIdle hook — an idle teammate while briefed work is uncredited is a
teammate with a job. Exit 2 sends it back to work with the list; exit 0 lets it
rest. At the budget ceiling it rests and a stand-down note is written, so the
ledger shows the swarm stopped on purpose, not by accident.

Input: teammate_name, team_name. Budget comes from active.json
{"budget": {"microUsd": N}, "spentMicroUsd": M} when present; absent budget
means no ceiling is known, so idle re-dispatch is still allowed.
"""
from __future__ import annotations

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _queen_ops_common import armed, briefed_task_ids, payload, queen_dir, read_json, refuse, task_is_credited  # noqa: E402


def budget_exhausted(active) -> bool:
    if not isinstance(active, dict):
        return False
    budget = active.get("budget") or {}
    ceiling = budget.get("microUsd") if isinstance(budget, dict) else None
    spent = active.get("spentMicroUsd")
    return isinstance(ceiling, (int, float)) and isinstance(spent, (int, float)) and spent >= ceiling


def main() -> int:
    data = payload()
    if not armed():
        return 0
    open_ids = [t for t in briefed_task_ids() if not task_is_credited(t)[0]]
    if not open_ids:
        return 0
    active = read_json(os.path.join(queen_dir(), "active.json"))
    if budget_exhausted(active):
        note = os.path.join(queen_dir(), "receipts", f"stand-down-{int(time.time())}.json")
        try:
            os.makedirs(os.path.dirname(note), exist_ok=True)
            with open(note, "w", encoding="utf-8") as fh:
                json.dump({"kind": "stand-down", "reason": "budget ceiling reached", "openTasks": open_ids,
                           "teammate": data.get("teammate_name"), "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}, fh, indent=2)
        except OSError:
            pass
        return 0
    who = data.get("teammate_name") or "teammate"
    return refuse(f"queen-ops: {who} is idle while {len(open_ids)} briefed task(s) lack receipts: {', '.join(open_ids)}. Pick one up, or verify one as its named verifier.")


if __name__ == "__main__":
    sys.exit(main())
