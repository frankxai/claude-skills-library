#!/usr/bin/env python3
"""TaskCompleted hook — a task is done when the verifier says so, not the maker.

Input: task_id, task_subject, optionally task_description, teammate_name,
team_name. Exit 2 keeps the task open and feeds stderr back.

Credit needs two files under .starlight/queen/receipts/:
  <task_id>.verify.json  credited:true, reruns[] (each exitCode 0, command on
                         the Brief's allowedChecks), verifier{id,model?} that is
                         independent of the Brief's maker
  <task_id>.taste.json   verdict pass|ship, pack (which taste contract), reviewer{id}
A task that was never briefed cannot complete either: there is nothing to
credit it against.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _queen_ops_common import armed, brief_path, payload, read_json, refuse, task_is_credited  # noqa: E402


def main() -> int:
    data = payload()
    if not armed():
        return 0
    task_id = data.get("task_id") or ""
    if not task_id:
        return refuse("queen-ops: TaskCompleted without a task_id; refusing (fail closed).")
    if read_json(brief_path(task_id)) is None:
        return refuse(f"queen-ops: task {task_id} cannot complete — it was never briefed ({os.path.relpath(brief_path(task_id))} missing).")
    ok, problems = task_is_credited(task_id)
    if ok:
        return 0
    lines = "\n".join(f"  - {p}" for p in problems)
    return refuse(
        f"queen-ops: task {task_id} is not credited. A worker's word is a claim; credit comes from the verifier's re-run.\n{lines}\n"
        f"Have the independent verifier write .starlight/queen/receipts/{task_id}.verify.json and the taste reviewer write {task_id}.taste.json, then complete again."
    )


if __name__ == "__main__":
    sys.exit(main())
