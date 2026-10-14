#!/usr/bin/env python3
"""Stop hook — do not let a UI change end unaudited.

This is the closing half of the loop. The PreToolUse gate recorded which UI
files were touched; this checks, at the moment the turn would end, whether the
audit actually happened. If it did not, it blocks the stop once and says what is
missing. The agent then runs the audit and stops again — the second stop is
always allowed.

Works in windows. A window opens with the first UI change and closes when a
stop finds both receipts, or on the stop that follows its one block. Receipts
count only from inside the window, so an audit run for an earlier change never
covers a later one, and the next UI change opens a new window and re-arms the
gate. Within a window it blocks AT MOST ONCE, guarded by `stop_hook_active`, a
persisted flag, and an explicit opt-out. A hook that can loop is worse than no
hook.

UI files edited through the shell (sed, a heredoc, a Python one-liner) never
pass through the PreToolUse matcher. The SessionStart hook records which files
were already dirty when the session began; this hook compares the working tree
against that baseline and reads HEAD's reflog for commits made here, so a UI
change counts however it was made, committed or not.

Opt out entirely with WEB_GATE_NO_STOP=1.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime

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


def entry_time(entry) -> float:
    """Epoch seconds of a transcript entry; 0 when it carries no timestamp."""
    stamp = entry.get("timestamp") if isinstance(entry, dict) else None
    if not isinstance(stamp, str):
        return 0.0
    try:
        return datetime.fromisoformat(stamp.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


# The matrix the gate asks for: three widths, both themes. capture.mjs prints
# every file it wrote as <out>/<label>/<width>-<theme>.png.
REQUIRED_SHOTS = {(w, t) for w in ("375", "768", "1440") for t in ("light", "dark")}
SHOT_PATH = re.compile(r"(\d+)-(light|dark)\.png")


def captured(text: str) -> bool:
    """A capture run that proves something: the whole matrix of the changed
    state written, or an honest report that nothing could be rendered. A
    partial matrix proves neither, whether shots failed or were never asked
    for, and a "before" run only records the starting point."""
    low = text.lower()
    if "cannot capture:" in low:
        return True
    if "shot(s) for" not in low or "incomplete:" in low:
        return False
    if 'shot(s) for "before"' in low:
        return False
    return REQUIRED_SHOTS <= {m.groups() for m in SHOT_PATH.finditer(low)}


# How a fetch that did not fail as a call can still have failed: a tool that
# reports the error as text, or curl without -f printing an error page with
# exit 0. GitHub's raw host answers with a status line ("429: Too Many
# Requests"); other hosts and proxies with the reason phrase alone.
FETCH_FAILED = ("error:", "failed", "could not resolve", "not found", "forbidden",
                "too many requests", "rate limit", "internal server error",
                "bad gateway", "service unavailable", "gateway timeout")
STATUS_LINE = re.compile(r"[45]\d\d\b")


def fetched(block: dict) -> bool:
    """The fetch returned the guidelines, not an error.

    A denylist, not a positive match on the document: WebFetch returns a
    model's summary of the page, whose wording no check can predict.
    """
    if block.get("is_error"):
        return False
    head = result_text(block).lower().lstrip()[:120]
    return (bool(head) and not STATUS_LINE.match(head)
            and not any(m in head for m in FETCH_FAILED))


def receipts(path: str, since: float = 0.0, proof_since: float = 0.0):
    """(audited, proved) from calls made at or after `since`, not from prose.

    A call counts only through its own result: a fetch whose result is not an
    error, and a capture.mjs run whose result shows the matrix was captured or
    honestly could not be. A capture must also start at or after
    `proof_since`, the last UI edit, so screenshots of an earlier state do not
    stand for the final one. Entries without a timestamp are kept rather than
    guessed away.
    """
    audited = proved = False
    fetch_ids, capture_ids = set(), {}
    for f in transcript_files(path):
        try:
            fh = open(f, "r", encoding="utf-8", errors="ignore")
        except OSError:
            continue
        with fh:
            for line in fh:
                low = line.lower()
                pending = fetch_ids | set(capture_ids)
                # Cheap prefilter: most lines mention none of these and are
                # never parsed.
                if not ("capture.mjs" in low
                        or any(n in low for n in EVIDENCE)
                        or (pending and '"tool_result"' in line
                            and any(i and i in line for i in pending))):
                    continue
                try:
                    entry = json.loads(line)
                except ValueError:
                    continue
                stamp = entry_time(entry)
                if stamp and stamp < since:
                    continue
                for block in content_blocks(line):
                    kind = block.get("type")
                    if kind == "tool_use":
                        tid = block.get("id")
                        if not tid:
                            continue  # nothing could ever answer it
                        name = str(block.get("name", ""))
                        args = json.dumps(block.get("input", {})).lower()
                        if any(n in args for n in EVIDENCE) and is_fetch(name, args):
                            fetch_ids.add(tid)
                        if name == "Bash" and CAPTURE_RUN.search(args):
                            capture_ids[tid] = stamp
                    elif kind == "tool_result":
                        tid = block.get("tool_use_id")
                        if tid in fetch_ids and fetched(block):
                            audited = True
                        if (tid in capture_ids and captured(result_text(block))
                                and (not capture_ids[tid] or capture_ids[tid] >= proof_since)):
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
        # A rename or copy is followed by its source path. Keep it: moving
        # app/page.tsx out of app/ is a UI change even if the new path is not.
        if entry[0] in "RC" and i < len(parts) and parts[i]:
            paths.append(parts[i])
            i += 1
    return paths


def last_edit(cwd: str, touched: list) -> float:
    """When the newest of the touched files that still exist was written.

    File times, not the gate's record of Edit calls, so an edit made through
    the shell moves it too.
    """
    root = (git(cwd, "rev-parse", "--show-toplevel") or "").strip() or cwd
    newest = 0.0
    for rel in touched:
        try:
            newest = max(newest, os.stat(os.path.join(root, rel)).st_mtime)
        except OSError:
            pass  # deleted: nothing left to capture
    return newest


def fingerprint(root: str, rel: str):
    try:
        st = os.stat(os.path.join(root, rel))
    except OSError:
        return None
    return [st.st_mtime_ns, st.st_size]


def reflog_size(root: str) -> int:
    """How many times HEAD has moved in this checkout; 0 before the first commit."""
    return len((git(root, "log", "-g", "--format=%H", "HEAD") or "").splitlines())


def committed_here(root: str, mark: int) -> set:
    """Files in commits made in this checkout since the reflog stood at `mark`.

    The reflog says how HEAD moved. `commit:` entries are commits made here;
    a pull, merge, rebase or checkout records itself differently, so other
    people's work that a `git pull` brings in is never counted. A position, not
    a time: the reflog keeps whole seconds, too coarse to order a commit
    against the moment a window opened.
    """
    lines = (git(root, "log", "-g", "--format=%H%x09%gs", "HEAD") or "").splitlines()
    files = set()
    for line in lines[:max(len(lines) - mark, 0)][:200]:  # newest first
        sha, _, subject = line.partition("\t")
        if not re.match(r"commit( \((amend|initial)\))?:", subject):
            continue
        diff = git(root, "diff-tree", "--no-commit-id", "--name-only", "-r", "--root", sha)
        files.update(x for x in (diff or "").splitlines() if x)
    return files


def changed_outside_tools(cwd: str, baselines: dict) -> list:
    """UI files changed in this window that the Edit/Write gate never saw.

    Uncommitted changes are compared with the files that were already dirty
    when the window opened; committed ones come from the reflog entries added
    since then.
    """
    root = (git(cwd, "rev-parse", "--show-toplevel") or "").strip()
    base = baselines.get(root) if root else None
    if not isinstance(base, dict):
        return []  # no baseline for this checkout: nothing to compare against
    before = base.get("dirty") or {}
    changed = set()
    for rel in dirty_files(root):
        if rel not in before or before[rel] != fingerprint(root, rel):
            changed.add(rel)
    mark = base.get("reflog")
    if isinstance(mark, int):  # a baseline from before this field: no commit check
        changed |= committed_here(root, mark)
    return sorted(p for p in changed if UI_PATH.search(p) and not NOT_UI.search(p))


def close_window(state: dict, cwd: str) -> None:
    """End this change set: the next UI change opens a fresh window."""
    state.update({"touched": [], "fired": False, "blocked": False,
                  "window_start": None, "closed_at": time.time()})
    root = (git(cwd, "rev-parse", "--show-toplevel") or "").strip()
    baselines = state.get("baseline") or {}
    if root in baselines:
        baselines[root] = {"dirty": {rel: fingerprint(root, rel) for rel in dirty_files(root)},
                           "reflog": reflog_size(root)}


def write_state(path: str, state: dict) -> None:
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | NOFOLLOW, 0o600)
        with os.fdopen(fd, "w") as fh:
            json.dump(state, fh)
    except OSError:
        pass


def main() -> int:
    if os.environ.get("WEB_GATE_NO_STOP") == "1":
        return 0
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    session_id = payload.get("session_id", "")
    sp = state_path(session_id)
    state = read_state(sp)
    cwd = payload.get("cwd") or os.getcwd()

    # Already continued once because of a stop hook — never chain. If the
    # block was ours, this is the stop after it: the window has had its one
    # chance, so close it and let the next change open a new one.
    if payload.get("stop_hook_active"):
        if state.get("blocked"):
            close_window(state, cwd)
            write_state(sp, state)
        return 0

    floor = state.get("closed_at") or state.get("started") or 0.0
    touched = list(state.get("touched") or [])
    touched += [p for p in changed_outside_tools(cwd, state.get("baseline") or {})
                if p not in touched]
    if not touched:
        return 0

    # Receipts count from the first UI edit of this window, so the "before"
    # capture and anything done for an earlier change do not close it.
    # The capture must also follow the last UI edit: screenshots taken before
    # a final tweak show a state that no longer exists.
    window = state.get("window_start") or floor
    audited, proved = receipts(payload.get("transcript_path", ""), window,
                               max(window, last_edit(cwd, touched)))
    # BOTH halves close the gate. Gating on `audited` alone let a turn that ran
    # the guidelines audit but never rendered anything pass silently, which is
    # exactly the enforcement-that-does-not-enforce failure this hook exists to
    # prevent. `proved` is satisfied by a complete capture.mjs run OR by its
    # honest "cannot capture:" line — reporting that you could not render
    # counts; a partial matrix does not.
    if (audited and proved) or state.get("blocked"):
        close_window(state, cwd)
        write_state(sp, state)
        return 0

    state["blocked"] = True
    write_state(sp, state)

    shown = touched[:8]
    more = f" (+{len(touched) - 8} more)" if len(touched) > 8 else ""
    missing = []
    if not audited:
        missing.append("`web-design-guidelines` audit on the changed files (it starts by fetching the live guidelines)")
    if not proved:
        missing.append("`visual-proof` capture of the final state, after the last UI edit, at 375 / 768 / 1440 in light and dark with `node .claude/skills/visual-proof/capture.mjs` (or an explicit statement that capture was impossible here, and why)")

    reason = (
        "web-release-gate: this turn changed UI files but the gate did not close.\n\n"
        f"Touched: {', '.join(shown)}{more}\n\n"
        "Still missing:\n"
        + "\n".join(f"  - {m}" for m in missing)
        + "\n\nRun what is missing now, then report the receipt:\n"
        "  Audit:  N findings, N fixed, N waived (with reason)\n"
        "  Visual: before/after at 375/768/1440, light+dark — or why not captured\n\n"
        "If the change is genuinely not visual (a fetch call, a type, a copy fix), say that "
        "in one line and stop. This check fires once for this set of changes; the next UI "
        "change re-arms it."
    )

    print(json.dumps({"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
