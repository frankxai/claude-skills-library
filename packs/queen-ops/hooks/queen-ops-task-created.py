#!/usr/bin/env python3
"""TaskCreated hook — no Brief, no task.

Input (Claude Code agent teams): task_id, task_subject, optionally
task_description, teammate_name, team_name. Exit 2 refuses the creation and
feeds stderr back to the agent.

The Brief is read from .starlight/queen/briefs/<task_id>.json, or from a
```json fenced block in task_description that carries the brief schema (the
hook then writes it to that path so the completion hook can find it). A task
with neither is refused with every problem listed, in the words of
briefProblems() from the kernel.
"""
from __future__ import annotations

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _queen_ops_common import BRIEF_SCHEMA, armed, brief_path, brief_problems, payload, read_json, refuse  # noqa: E402

FENCE = re.compile(r"```json\s*\n(.*?)\n```", re.S)


def brief_from_description(text: str):
    for m in FENCE.finditer(text or ""):
        try:
            obj = json.loads(m.group(1))
        except Exception:
            continue
        if isinstance(obj, dict) and obj.get("schema") == BRIEF_SCHEMA:
            return obj
    return None


def main() -> int:
    data = payload()
    if not armed():
        return 0
    task_id = data.get("task_id") or ""
    if not task_id:
        return refuse("queen-ops: TaskCreated without a task_id; refusing (fail closed).")
    path = brief_path(task_id)
    brief = read_json(path)
    source = path
    if brief is None:
        brief = brief_from_description(data.get("task_description") or "")
        source = "task_description"
    if brief is None:
        return refuse(
            f"queen-ops: task {task_id} refused — no Brief. Write {os.path.relpath(path)} "
            f"({BRIEF_SCHEMA}) or include it as a ```json block in the task description, then create the task again."
        )
    problems = brief_problems(brief)
    if problems:
        lines = "\n".join(f"  - {p}" for p in problems)
        return refuse(f"queen-ops: task {task_id} refused — Brief from {source} is not dispatchable ({len(problems)} problem(s)):\n{lines}")
    if source == "task_description":
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(brief, fh, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
