#!/usr/bin/env python3
"""PreToolUse hook — fire the gate the moment a UI file is edited.

Matcher: Edit|Write|MultiEdit|NotebookEdit

A SessionStart note gets read once and then buried under fifty tool calls. This
fires at the exact moment it matters: the first time the agent writes to a file
that changes how a surface looks. It injects the gate reminder as context and
records the touched files so the Stop hook can check that the audit happened.

Never blocks. It returns `additionalContext` only — a design change should never
be denied by a linter-shaped hook, only held to a standard.

Fires once per change set by default: the Stop hook re-arms it when a
window closes (set WEB_GATE_EVERY_EDIT=1 to fire on every UI edit).
"""
import json
import os
import re
import sys
import tempfile
import time

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


# A canvas, shader, or 3D element: the edit adds one or changes one. These
# markers are what `gpu-surface` governs, so the Stop hook asks for its probe.
GPU_CANVAS = re.compile(
    r"<Canvas\b|@react-three/|@paper-design/|ShaderMount|\bnew\s+THREE\.|from\s+['\"]three['\"]"
    r"|getContext\(\s*['\"](?:webgl2?|webgpu|experimental-webgl)['\"]"
)
# Glass is CSS and costs no canvas, so it routes to its recipe and asks for no probe.
GLASS = re.compile(r"backdrop-filter|backdropFilter")

GPU_REMINDER = """\
GPU SURFACE — this edit adds or changes a canvas, shader, or 3D element.

  1. Read the `gpu-surface` skill if you have not this session: does the page
     earn it, is it the only one on the route, what the repo's taste file says.
  2. Build it with the matching recipe: `liquid-logo` for a mark in liquid
     metal, `shader-backdrop` for a gradient or grain field behind a headline,
     `r3f-scene` for real 3D. A look across the whole site starts in
     `material-system`.
  3. Before you finish, run the pack's GPU check on the route and fix what it
     fails: `node .claude/skills/gpu-surface/probe.mjs --url <route>`, with
     `--baseline <a route that has no surface>`.\
"""

GLASS_REMINDER = """\
GLASS — this edit uses backdrop-filter.

Build it with the `liquid-glass` skill: one recipe from the repo's tokens, an
opaque fallback, and a prefers-reduced-transparency rule. Something worth
seeing must sit behind the panel. If design.md already defines a glass recipe,
use that one.\
"""


def edited_text(tool_input: dict) -> str:
    """The text this edit touches: Write content, Edit/MultiEdit new and old strings."""
    parts = [tool_input.get(k) for k in ("content", "new_string", "old_string", "new_source")]
    for edit in tool_input.get("edits") or []:
        if isinstance(edit, dict):
            parts.append(edit.get("new_string"))
            parts.append(edit.get("old_string"))
    return "\n".join(p for p in parts if isinstance(p, str))


def existing_text(path: str, cwd: str) -> str:
    """Read an existing UI file safely when handling a partial Edit/MultiEdit."""
    target = path if os.path.isabs(path) else os.path.join(cwd or os.getcwd(), path)
    try:
        fd = os.open(target, os.O_RDONLY | NOFOLLOW)
    except OSError:
        return ""
    try:
        with os.fdopen(fd, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read(262144)
    except OSError:
        return ""


# The state path is predictable and the temp dir is world-writable, so on a
# shared host another local user can pre-create it as a symlink aimed at
# something we can write. 0o600 keeps the *content* private once the file is
# ours; it does nothing about following a link that is already there. O_NOFOLLOW
# makes the open fail instead of truncating the target. Absent on Windows, where
# a shared /tmp is not the threat model — hence getattr rather than a hard
# reference.
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)


def state_path(session_id: str) -> str:
    # session_id comes from the harness; sanitize before it becomes a filename.
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[:64] or "nosession"
    return os.path.join(tempfile.gettempdir(), f"web-gate-{safe}.json")


def read_state(path: str) -> dict:
    """Read prior state, refusing to follow a symlink planted at that path."""
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
    """Write 0600, never through a symlink."""
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | NOFOLLOW, 0o600)
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
    state = read_state(sp)

    already_fired = bool(state.get("fired"))
    touched = set(state.get("touched", []))
    touched.add(rel)
    state["touched"] = sorted(touched)
    state["fired"] = True
    # The first UI edit opens the window the Stop hook takes receipts from.
    if not state.get("window_start"):
        state["window_start"] = time.time()

    notes = []
    if not already_fired or os.environ.get("WEB_GATE_EVERY_EDIT") == "1":
        notes.append(REMINDER)

    # GPU work is announced once per window, at the edit that introduces or
    # modifies a GPU surface file, even when the general reminder already fired.
    text = edited_text(tool_input)
    is_partial_edit = "content" not in tool_input and "new_source" not in tool_input
    surface_text = text + ("\n" + existing_text(path, payload.get("cwd") or "") if is_partial_edit else "")
    if GPU_CANVAS.search(surface_text):
        state["gpu"] = True  # the Stop hook now asks for the probe's receipt
        if not state.get("gpu_fired"):
            state["gpu_fired"] = True
            notes.append(GPU_REMINDER)
    elif GLASS.search(text) and not state.get("glass_fired"):
        state["glass_fired"] = True
        notes.append(GLASS_REMINDER)

    try:
        write_state(sp, state)
    except OSError:
        pass

    if not notes:
        return 0

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "additionalContext": "\n\n".join(notes),
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
