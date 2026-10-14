#!/usr/bin/env python3
"""SessionStart hook — tell the agent the web-excellence pack exists.

Claude Code discovers skills from their frontmatter descriptions, which is
enough for a skill to be *available* but not enough to guarantee the sequencing
is followed. This injects the one paragraph that makes the gate the default,
and names the repo's own design contracts so they outrank the pack.

It also records which files were already uncommitted when the session began,
so the Stop hook can tell a UI change made through the shell (which the
Edit/Write gate never sees) from one that was there before. One `git status`;
no network.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import time

PACK_SKILLS = [
    "web-release-gate",
    "web-design-guidelines",
    "ui-ux-pro-max",
    "emil-design-eng",
    "apple-design",
    "review-animations",
    "improve-animations",
    "find-animation-opportunities",
    "animation-vocabulary",
    "core-web-vitals",
    "visual-proof",
    "image-to-code",
    "extract-design-system",
    "brandkit",
]

# Repo-level design contracts, in precedence order. These beat the pack.
# Casing varies across repos (frankx.ai uses design.md, Arcanea uses DESIGN.md),
# so each entry is matched case-insensitively against its directory.
CONTRACTS = [
    "design.md",
    "taste.md",
    "tailwind.config.js",
    "tailwind.config.ts",
    "lib/design-system.ts",
    "packages/design-system",
    "app/globals.css",
    "apps/web/app/globals.css",
]


def find_contract(cwd: str, rel: str) -> str | None:
    """Return the real relative path if `rel` exists under `cwd`, any casing."""
    parent, name = os.path.split(rel)
    base = os.path.join(cwd, parent) if parent else cwd
    try:
        for entry in os.listdir(base):
            if entry.lower() == name.lower():
                return os.path.join(parent, entry) if parent else entry
    except OSError:
        pass
    return None


# Same state file and symlink guard as web-excellence-gate.py.
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)


def state_path(session_id: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[:64] or "nosession"
    return os.path.join(tempfile.gettempdir(), f"web-gate-{safe}.json")


def git(cwd: str, *args: str):
    try:
        out = subprocess.run(["git", "-C", cwd, *args], capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout if out.returncode == 0 else None


def record_baseline(session_id: str, cwd: str) -> None:
    """Fingerprint every uncommitted file in this checkout, once per session.

    SessionStart fires again on resume and after compaction; keeping the first
    baseline means a change made before either still counts as this session's.
    """
    root = (git(cwd, "rev-parse", "--show-toplevel") or "").strip()
    if not root:
        return
    sp = state_path(session_id)
    try:
        fd = os.open(sp, os.O_RDONLY | NOFOLLOW)
        with os.fdopen(fd, "r") as fh:
            state = json.load(fh)
    except (OSError, ValueError):
        state = {}
    if not isinstance(state, dict):
        state = {}
    baselines = state.setdefault("baseline", {})
    if root in baselines:
        return
    # When this session began: the Stop hook counts receipts for shell-only
    # changes from this point.
    state.setdefault("started", time.time())
    out = git(root, "status", "--porcelain=v1", "-z", "--untracked-files=all")
    if out is None:
        return
    dirty, parts, i = {}, out.split("\0"), 0
    while i < len(parts):
        entry = parts[i]
        i += 1
        if len(entry) < 4:
            continue
        rels = [entry[3:]]
        if entry[0] in "RC" and i < len(parts) and parts[i]:
            rels.append(parts[i])  # the source of a rename or copy
            i += 1
        for rel in rels:
            try:
                st = os.stat(os.path.join(root, rel))
                dirty[rel] = [st.st_mtime_ns, st.st_size]
            except OSError:
                dirty[rel] = None
    # Where HEAD's reflog stands: the Stop hook counts commits made here from
    # this entry on, by position, since the reflog only keeps whole seconds.
    reflog = len((git(root, "log", "-g", "--format=%H", "HEAD") or "").splitlines())
    baselines[root] = {"dirty": dirty, "reflog": reflog}
    try:
        fd = os.open(sp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | NOFOLLOW, 0o600)
        with os.fdopen(fd, "w") as fh:
            json.dump(state, fh)
    except OSError:
        pass


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    # A session can start or resume below the repo root (cwd = <repo>/app);
    # the pack, the contracts and the baseline all live at the root. The
    # checkout the session is in wins over CLAUDE_PROJECT_DIR: in a worktree
    # that names the main checkout, and the stop hook keys baselines by the
    # checkout it runs in.
    cwd = payload.get("cwd") or os.getcwd()
    project_dir = ((git(cwd, "rev-parse", "--show-toplevel") or "").strip()
                   or os.environ.get("CLAUDE_PROJECT_DIR") or cwd)
    skills_dir = os.path.join(project_dir, ".claude", "skills")
    present = [s for s in PACK_SKILLS if os.path.isdir(os.path.join(skills_dir, s))]
    if not present:
        # Pack not installed here — stay quiet rather than advertising nothing.
        return 0

    record_baseline(payload.get("session_id", ""), project_dir)

    contracts = [r for r in (find_contract(project_dir, c) for c in CONTRACTS) if r]

    lines = [
        "WEB EXCELLENCE PACK is installed in this repo.",
        "",
        "Any task that changes what a web surface looks like, feels like, moves like, "
        "or how it is interacted with goes through the `web-release-gate` skill FIRST — "
        "read it before writing UI code, not after. It sequences the rest of the pack "
        "and defines what \"done\" requires (audit output + screenshots, never a "
        "self-assigned score).",
        "",
        "Installed: " + ", ".join(present) + ".",
    ]
    if contracts:
        lines += [
            "",
            "This repo's own design contracts OUTRANK every skill in the pack: "
            + ", ".join(contracts)
            + ". The pack supplies craft; the repo supplies the brand. On conflict, the repo wins.",
        ]
    lines += [
        "",
        "Non-negotiable before calling any UI change complete: run `web-design-guidelines` "
        "on the changed files, honor prefers-reduced-motion, keep keyboard focus visible, "
        "and verify 375 / 768 / 1440. If you could not verify something, say so — do not "
        "describe a page you never rendered.",
    ]

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": "\n".join(lines),
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
