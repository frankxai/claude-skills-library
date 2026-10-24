#!/usr/bin/env python3
"""Stop hook — the turn does not end with briefed work uncredited.

Blocks at most once per set of open briefs: guarded by `stop_hook_active`, a
persisted flag keyed to the open set, and QUEEN_OPS_NO_STOP=1. The second stop
is always allowed, and the reason it was allowed is in the transcript, so an
unfinished swarm is visible rather than silent.
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _queen_ops_common import armed, briefed_task_ids, payload, read_state, state_path, task_is_credited, write_state  # noqa: E402


def main() -> int:
    data = payload()
    if not armed() or os.environ.get("QUEEN_OPS_NO_STOP") == "1":
        return 0
    open_ids = [t for t in briefed_task_ids() if not task_is_credited(t)[0]]
    if not open_ids:
        return 0
    sp = state_path(data.get("session_id", ""))
    state = read_state(sp)
    key = ",".join(open_ids)
    if data.get("stop_hook_active") or state.get("blocked_for") == key:
        return 0  # blocked once already for exactly this set; let the turn end
    state["blocked_for"] = key
    try:
        write_state(sp, state)
    except OSError:
        pass
    detail = []
    for t in open_ids:
        _, problems = task_is_credited(t)
        detail.append(f"  {t}: {problems[0] if problems else 'uncredited'}")
    print(json.dumps({
        "decision": "block",
        "reason": "queen-ops: briefed task(s) still lack receipts — finish, verify, or stand them down with a reason before ending:\n" + "\n".join(detail),
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
