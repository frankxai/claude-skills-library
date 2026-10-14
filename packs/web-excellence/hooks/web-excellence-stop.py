#!/usr/bin/env python3
"""Stop hook — do not let a UI change end unaudited.

This is the closing half of the loop. The PreToolUse gate recorded which UI
files were touched; this checks, at the moment the turn would end, whether the
audit actually happened. If it did not, it blocks the stop once and says what is
missing. The agent then runs the audit and stops again — the second stop is
always allowed.

Blocks AT MOST ONCE per session, guarded three ways (`stop_hook_active`, a
persisted flag, and an explicit opt-out). A hook that can loop is worse than no
hook.

UI files edited through the shell (sed, a heredoc, a Python one-liner) never
pass through the PreToolUse matcher. The SessionStart hook records which files
were already dirty when the session began; this hook compares the working tree
against that baseline, so an uncommitted UI change counts however it was made.

Opt out entirely with WEB_GATE_NO_STOP=1.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

# Evidence that the audit actually RAN.
#
# These markers must be things only a real run produces. Matching on the skill
# *name* does not work: the PreToolUse reminder names the skills it is asking
# for, that text lands in the transcript via additionalContext, and the check
# then passes on the strength of our own nagging. That bug shipped in the first
# version of this hook and made the whole loop a no-op — see
# tests/test_hooks.py::test_reminder_cannot_satisfy_evidence, which exists to
# stop it coming back.
#
# Matching the markers anywhere in the transcript repeated that bug one level
# down: web-design-guidelines/SKILL.md quotes the guidelines URL and
# visual-proof/SKILL.md names the output directory, so loading the two skills
# closed the gate before either step ran. So a marker now counts only in the
# place a run puts it:
#   - EVIDENCE inside the *input* of a fetch call (WebFetch, an MCP fetch, or a
#     curl/wget in Bash). Skill text and file reads arrive as results, never as
#     a call's input.
#   - VISUAL_EVIDENCE inside the *result* of a Bash call that executed
#     capture.mjs. Reading the script's source prints the same strings, so the
#     call has to run it, not cat it.
# See tests/test_hooks.py::test_skill_text_cannot_satisfy_evidence.
#
# That test lives with the pack, at packs/web-excellence/tests/test_hooks.py in
# frankxai/claude-skills-library. install.sh does not vendor it into target
# repos — it tests the pack, not the repo. If you hand-edit this file in a
# target repo, run it upstream.
EVIDENCE = (
    "web-interface-guidelines/main/command.md",
    "raw.githubusercontent.com/vercel-labs/web-interface-guidelines",
)
VISUAL_EVIDENCE = (
    "shot(s) for",             # capture.mjs success line
    "cannot capture:",         # capture.mjs honest-failure line — reporting counts
)
CAPTURE_RUN = re.compile(r"\bnode\s+(?:--?\S+\s+)*\S*capture\.mjs\b")
SHELL_FETCH = re.compile(r"\b(curl|wget)\b")

# Mirrors UI_PATH / NOT_UI in web-excellence-gate.py. Applied to files changed
# outside the Edit/Write tools, which the gate never saw.
UI_PATH = re.compile(
    r"(^|/)(app|src|components|pages|styles|layouts|ui|islands)/.*\.(tsx|jsx|ts|js|vue|svelte|astro|css|scss|sass)$"
    r"|(^|/)(tailwind\.config|globals?)\.(js|ts|css)$"
    r"|\.(css|scss|sass)$"
)
NOT_UI = re.compile(
    r"(^|/)(api|actions|lib|utils|hooks|server|__tests__|tests?)/"
    r"|\.(test|spec|d)\.(ts|tsx|js|jsx)$"
    r"|(^|/)route\.(ts|js)$"
    r"|(^|/)(middleware|proxy|instrumentation)\.(ts|js)$"
)


# See web-excellence-gate.py: the state path is predictable and the temp dir is
# world-writable, so a symlink planted there would otherwise be followed on both
# read and write. O_NOFOLLOW turns that into a failed open. Absent on Windows.
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)


def state_path(session_id: str) -> str:
    # session_id comes from the harness; sanitize before it becomes a filename.
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[:64] or "nosession"
    return os.path.join(tempfile.gettempdir(), f"web-gate-{safe}.json")


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


def transcript_files(path: str) -> list:
    """The session transcript plus its subagents' (<session>/subagents/*.jsonl).

    A subagent's tool calls are written to its own file, so an audit delegated
    to one would otherwise look like no audit at all.
    """
    if not path or not os.path.exists(path):
        return []
    files = [path]
    sub = os.path.join(os.path.splitext(path)[0], "subagents")
    try:
        files += sorted(os.path.join(sub, f) for f in os.listdir(sub) if f.endswith(".jsonl"))
    except OSError:
        pass
    return files


def content_blocks(line: str) -> list:
    try:
        entry = json.loads(line)
    except ValueError:
        return []
    message = entry.get("message") if isinstance(entry, dict) else None
    content = message.get("content") if isinstance(message, dict) else None
    if not isinstance(content, list):
        return []
    return [b for b in content if isinstance(b, dict)]


def result_text(block: dict) -> str:
    content = block.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(str(c.get("text", "")) for c in content if isinstance(c, dict))
    return ""


def is_fetch(name: str, args: str) -> bool:
    if name == "WebFetch" or name.startswith("mcp__"):
        return True
    return name == "Bash" and bool(SHELL_FETCH.search(args))


def receipts(path: str):
    """(audited, proved) from the calls the transcript records, not its prose."""
    audited = proved = False
    capture_ids = set()
    for f in transcript_files(path):
        try:
            fh = open(f, "r", encoding="utf-8", errors="ignore")
        except OSError:
            continue
        with fh:
            for line in fh:
                low = line.lower()
                # Cheap prefilter: most lines mention none of these and are
                # never parsed.
                if not ("capture.mjs" in low
                        or any(n in low for n in EVIDENCE)
                        or any(n in low for n in VISUAL_EVIDENCE)):
                    continue
                for block in content_blocks(line):
                    kind = block.get("type")
                    if kind == "tool_use":
                        name = str(block.get("name", ""))
                        args = json.dumps(block.get("input", {})).lower()
                        if any(n in args for n in EVIDENCE) and is_fetch(name, args):
                            audited = True
                        if name == "Bash" and CAPTURE_RUN.search(args):
                            capture_ids.add(block.get("id"))
                    elif kind == "tool_result" and block.get("tool_use_id") in capture_ids:
                        if any(n in result_text(block).lower() for n in VISUAL_EVIDENCE):
                            proved = True
                if audited and proved:
                    return True, True
    return audited, proved


def git(cwd: str, *args: str):
    try:
        out = subprocess.run(["git", "-C", cwd, *args], capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout if out.returncode == 0 else None


def dirty_files(root: str) -> list:
    """Paths with uncommitted changes, untracked included, relative to `root`."""
    out = git(root, "status", "--porcelain=v1", "-z", "--untracked-files=all")
    if out is None:
        return []
    paths, parts, i = [], out.split("\0"), 0
    while i < len(parts):
        entry = parts[i]
        i += 1
        if len(entry) < 4:
            continue
        paths.append(entry[3:])
        if entry[0] in "RC":  # a rename's source path follows; skip it
            i += 1
    return paths


def fingerprint(root: str, rel: str):
    try:
        st = os.stat(os.path.join(root, rel))
    except OSError:
        return None
    return [st.st_mtime_ns, st.st_size]


def changed_outside_tools(cwd: str, baselines: dict) -> list:
    """UI files changed since session start that the Edit/Write gate never saw.

    Only uncommitted changes count. Comparing commits against the start HEAD
    would also flag every file a `git pull` brought in, and a check that blocks
    on other people's work gets switched off.
    """
    root = (git(cwd, "rev-parse", "--show-toplevel") or "").strip()
    base = baselines.get(root) if root else None
    if not isinstance(base, dict):
        return []  # no baseline for this checkout: nothing to compare against
    before = base.get("dirty") or {}
    changed = []
    for rel in dirty_files(root):
        if not UI_PATH.search(rel) or NOT_UI.search(rel):
            continue
        if rel not in before or before[rel] != fingerprint(root, rel):
            changed.append(rel)
    return changed


def main() -> int:
    if os.environ.get("WEB_GATE_NO_STOP") == "1":
        return 0
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    # Already continued once because of a stop hook — never chain.
    if payload.get("stop_hook_active"):
        return 0

    session_id = payload.get("session_id", "")
    sp = state_path(session_id)
    state = read_state(sp)

    if state.get("blocked"):
        return 0
    touched = list(state.get("touched") or [])
    cwd = payload.get("cwd") or os.getcwd()
    touched += [p for p in changed_outside_tools(cwd, state.get("baseline") or {}) if p not in touched]
    if not touched:
        return 0

    audited, proved = receipts(payload.get("transcript_path", ""))
    # BOTH halves close the gate. Gating on `audited` alone let a turn that ran
    # the guidelines audit but never rendered anything pass silently, which is
    # exactly the enforcement-that-does-not-enforce failure this hook exists to
    # prevent. `proved` is satisfied by capture.mjs succeeding OR by its honest
    # "cannot capture:" line — reporting that you could not render counts.
    if audited and proved:
        return 0

    state["blocked"] = True
    try:
        fd = os.open(sp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | NOFOLLOW, 0o600)
        with os.fdopen(fd, "w") as fh:
            json.dump(state, fh)
    except OSError:
        pass

    shown = touched[:8]
    more = f" (+{len(touched) - 8} more)" if len(touched) > 8 else ""
    missing = []
    if not audited:
        missing.append("`web-design-guidelines` audit on the changed files (it starts by fetching the live guidelines)")
    if not proved:
        missing.append("`visual-proof` capture at 375 / 768 / 1440 with `node .claude/skills/visual-proof/capture.mjs` (or an explicit statement that capture was impossible here, and why)")

    reason = (
        "web-release-gate: this turn changed UI files but the gate did not close.\n\n"
        f"Touched: {', '.join(shown)}{more}\n\n"
        "Still missing:\n"
        + "\n".join(f"  - {m}" for m in missing)
        + "\n\nRun what is missing now, then report the receipt:\n"
        "  Audit:  N findings, N fixed, N waived (with reason)\n"
        "  Visual: before/after at 375/768/1440, light+dark — or why not captured\n\n"
        "If the change is genuinely not visual (a fetch call, a type, a copy fix), say that "
        "in one line and stop. This check fires once per session and will not fire again."
    )

    print(json.dumps({"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
