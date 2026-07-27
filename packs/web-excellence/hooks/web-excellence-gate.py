#!/usr/bin/env python3
"""PreToolUse hook — fire the gate the moment a UI file is edited.

Matcher: Edit|Write|MultiEdit|NotebookEdit

A SessionStart note gets read once and then buried under fifty tool calls. This
fires at the exact moment it matters: the first time the agent writes to a file
that changes how a surface looks. It injects the gate reminder as context and
records the touched files so the Stop hook can check that the audit happened.

Never blocks. It returns `additionalContext` only — a design change should never
be denied by a linter-shaped hook, only held to a standard.

Fires once per session by default (set WEB_GATE_EVERY_EDIT=1 to repeat).
"""
import json
import os
import re
import sys
import tempfile

UI_PATH = re.compile(
    r"(^|/)(app|src|components|pages|styles|layouts|ui|islands)/.*\.(tsx|jsx|ts|js|vue|svelte|astro|css|scss|sass)$"
    r"|(^|/)(tailwind\.config|globals?)\.(js|ts|css)$"
    r"|\.(css|scss|sass)$"
)
# Files that live in a UI directory but are not visual work.
NOT_UI = re.compile(
    r"(^|/)(api|actions|lib|utils|hooks|server|__tests__|tests?)/"
    r"|\.(test|spec|d)\.(ts|tsx|js|jsx)$"
    r"|(^|/)route\.(ts|js)$"
    r"|(^|/)(middleware|proxy|instrumentation)\.(ts|js)$"
)

REMINDER = """\
UI FILE TOUCHED — web-release-gate applies to this change.

Before you call it done:
  1. Read the `web-release-gate` skill if you have not this session. It orders
     the rest of the pack and defines the finish line.
  2. Repo contracts (design.md / taste.md / tailwind.config) outrank the pack.
  3. Run `web-design-guidelines` on the files you changed — it fetches the live
     Web Interface Guidelines and reports file:line findings.
  4. Motion in this change? `review-animations` on the diff. Its default is to
     flag; approval is earned.
  5. Verify 375 / 768 / 1440 and both themes with `visual-proof`. If you cannot
     capture, say so — do not describe a page you never rendered.

Baseline that holds regardless: visible keyboard focus, a real reduced-motion
variant, no `transition: all`, no `outline-none` without a :focus-visible
replacement, explicit image dimensions.

Touch only what the task requires. Do not restyle adjacent components.\
"""


def state_path(session_id: str) -> str:
    # session_id comes from the harness; sanitize before it becomes a filename.
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[:64] or "nosession"
    return os.path.join(tempfile.gettempdir(), f"web-gate-{safe}.json")


def write_state(path: str, state: dict) -> None:
    """Write 0600 — the temp dir is world-writable on a shared host."""
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as fh:
        json.dump(state, fh)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    tool_input = payload.get("tool_input") or {}
    path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    if not path:
        return 0

    rel = path.replace("\\", "/")
    if not UI_PATH.search(rel) or NOT_UI.search(rel):
        return 0

    session_id = payload.get("session_id", "")
    sp = state_path(session_id)
    try:
        state = json.load(open(sp)) if os.path.exists(sp) else {}
    except Exception:
        state = {}

    already_fired = bool(state.get("fired"))
    touched = set(state.get("touched", []))
    touched.add(rel)
    state["touched"] = sorted(touched)
    state["fired"] = True
    try:
        write_state(sp, state)
    except OSError:
        pass

    if already_fired and os.environ.get("WEB_GATE_EVERY_EDIT") != "1":
        return 0

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "additionalContext": REMINDER,
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
