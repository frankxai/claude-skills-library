#!/usr/bin/env python3
"""Tests for the web-excellence hooks and the CI linter.

    python3 packs/web-excellence/tests/test_hooks.py

Zero dependencies, no pytest — this has to run anywhere the hooks do.

The load-bearing one is test_reminder_cannot_satisfy_evidence. The first
version of this pack matched the Stop hook's "did the audit run" check against
the skill *names*, and the PreToolUse reminder names those same skills. The
reminder text landed in the transcript, the check saw the names, and the Stop
hook passed every time — the enforcement loop was a no-op from day one and
nothing caught it. That test is the reason it cannot come back.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
HOOKS = os.path.join(PACK, "hooks")
GATE = os.path.join(HOOKS, "web-excellence-gate.py")
STOP = os.path.join(HOOKS, "web-excellence-stop.py")
SESSION = os.path.join(HOOKS, "web-excellence-session.py")
LINT = os.path.join(PACK, "ci", "web-guidelines-lint.mjs")

BASH = "bash"
if sys.platform == "win32":
    git_bash = r"C:\Program Files\Git\bin\bash.exe"
    if os.path.exists(git_bash):
        BASH = git_bash

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def run_hook(path: str, payload: dict, env: dict | None = None):
    e = dict(os.environ)
    e.update(env or {})
    p = subprocess.run(
        [sys.executable, path],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=e,
    )
    out = p.stdout.strip()
    return (json.loads(out) if out else None), p.returncode


def load_reminder() -> str:
    src = open(GATE, encoding="utf-8").read()
    return re.search(r'REMINDER = """\\\n(.*?)"""', src, re.S).group(1)


def load_tuple(path: str, name: str) -> tuple:
    ns: dict = {}
    src = open(path, encoding="utf-8").read()
    block = re.search(rf"^{name} = \((.*?)\)$", src, re.S | re.M).group(1)
    exec(f"{name} = ({block})", ns)  # noqa: S102 — reading our own source
    return ns[name]


# --------------------------------------------------------------------------
# THE regression test.
# --------------------------------------------------------------------------
def test_reminder_cannot_satisfy_evidence() -> None:
    reminder = load_reminder().lower()
    for group in ("EVIDENCE", "VISUAL_EVIDENCE"):
        markers = load_tuple(STOP, group)
        hits = [m for m in markers if m.lower() in reminder]
        check(
            f"{group}: no marker appears in the PreToolUse reminder",
            not hits,
            f"self-satisfying markers {hits} — the Stop hook would pass on its own nagging",
        )


def test_gate_fires_only_on_ui_paths() -> None:
    cases = [
        ("components/Hero.tsx", True),
        ("app/(marketing)/page.tsx", True),
        ("styles/main.css", True),
        ("app/api/checkout/route.ts", False),
        ("lib/utils.ts", False),
        ("components/Hero.test.tsx", False),
        ("scripts/build.mjs", False),
        ("README.md", False),
    ]
    for path, should_fire in cases:
        out, _ = run_hook(GATE, {"session_id": f"t{abs(hash(path))}", "tool_input": {"file_path": path}})
        fired = out is not None
        check(f"gate {'fires' if should_fire else 'silent'}: {path}", fired == should_fire)


def test_gate_fires_once_per_session() -> None:
    sid = "oncetest"
    try:
        os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
    except OSError:
        pass
    first, _ = run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/A.tsx"}})
    second, _ = run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/B.tsx"}})
    check("gate fires on first UI edit", first is not None)
    check("gate silent on second UI edit", second is None)


def test_stop_blocks_then_never_again() -> None:
    sid = "stoptest"
    sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
    try:
        os.remove(sp)
    except OSError:
        pass
    run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/C.tsx"}})

    first, _ = run_hook(STOP, {"session_id": sid, "transcript_path": "/does/not/exist"})
    check("stop blocks when UI changed and no audit ran", first is not None and first.get("decision") == "block")

    second, _ = run_hook(STOP, {"session_id": sid, "transcript_path": "/does/not/exist"})
    check("stop never blocks twice", second is None)


GUIDELINES_URL = ("https://raw.githubusercontent.com/vercel-labs/"
                  "web-interface-guidelines/main/command.md")
CAPTURE_CMD = ("node .claude/skills/visual-proof/capture.mjs "
               "--url http://localhost:3000/pricing --label after")


def stamped(entry: dict, ts) -> str:
    if ts:
        entry["timestamp"] = ts
    return json.dumps(entry) + "\n"


def tool_use(tid: str, name: str, tool_input: dict, ts: str = "") -> str:
    return stamped({"type": "assistant", "message": {"role": "assistant", "content": [
        {"type": "tool_use", "id": tid, "name": name, "input": tool_input}]}}, ts)


def tool_result(tid: str, text: str, ts: str = "", is_error: bool = False) -> str:
    block = {"type": "tool_result", "tool_use_id": tid, "content": text}
    if is_error:
        block["is_error"] = True
    return stamped({"type": "user", "message": {"role": "user", "content": [block]}}, ts)


def user_text(text: str) -> str:
    """How a loaded skill's body reaches the transcript."""
    return json.dumps({"type": "user", "isMeta": True, "message": {"role": "user", "content": [
        {"type": "text", "text": text}]}}) + "\n"


AUDIT_LINE = (tool_use("audit1", "WebFetch", {"url": GUIDELINES_URL, "prompt": "list every rule"})
              + tool_result("audit1", "# Web Interface Guidelines\n- Inputs ≥16px on mobile"))
def shots(label: str = "after", widths=("375", "768", "1440"), themes=("light", "dark")) -> str:
    """What capture.mjs prints for a run that wrote every requested shot."""
    paths = [f"  .visual-proof/{label}/{w}-{t}.png" for w in widths for t in themes]
    return f'captured {len(paths)} shot(s) for "{label}":\n' + "\n".join(paths)


SHOTS_LINE = (tool_use("shot1", "Bash", {"command": CAPTURE_CMD})
              + tool_result("shot1", shots()))
CANNOT_LINE = (tool_use("shot2", "Bash", {"command": CAPTURE_CMD})
               + tool_result("shot2", "Cannot capture: Playwright is not available in this project."))


def stop_with_transcript(sid: str, body: str, subagent: str = ""):
    """Arm the gate for `sid`, then run the Stop hook against a fake transcript.

    `subagent`, when given, is written where Claude Code keeps a subagent's
    transcript: <session>/subagents/agent-*.jsonl beside <session>.jsonl.
    """
    sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
    try:
        os.remove(sp)
    except OSError:
        pass
    run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/X.tsx"}})
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, f"{sid}.jsonl")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(body)
        if subagent:
            os.makedirs(os.path.join(d, sid, "subagents"))
            with open(os.path.join(d, sid, "subagents", "agent-a1.jsonl"), "w", encoding="utf-8") as fh:
                fh.write(subagent)
        out, _ = run_hook(STOP, {"session_id": sid, "transcript_path": path})
    return out


def test_stop_requires_both_halves() -> None:
    """Audit alone must not close the gate.

    The first cut returned early on `audited` and never consulted `proved`, so a
    turn that ran the guidelines but rendered nothing passed silently — the
    screenshot requirement had no enforcement path at all. Same failure shape as
    the reminder-satisfies-its-own-evidence bug: a gate that does not gate.
    """
    audit_only = stop_with_transcript("bothaudit", AUDIT_LINE)
    check("audit without visual proof still blocks",
          audit_only is not None and audit_only.get("decision") == "block")
    if audit_only:
        reason = audit_only.get("reason", "")
        check("the block names only what is actually missing",
              "visual-proof" in reason and "web-design-guidelines" not in reason,
              reason)

    visual_only = stop_with_transcript("bothvisual", SHOTS_LINE)
    check("visual proof without an audit still blocks",
          visual_only is not None and visual_only.get("decision") == "block")

    both = stop_with_transcript("bothdone", AUDIT_LINE + SHOTS_LINE)
    check("gate closes when both halves ran", both is None)

    excused = stop_with_transcript("bothexcused", AUDIT_LINE + CANNOT_LINE)
    check("an honest 'cannot capture' counts as visual proof", excused is None)


def test_skill_text_cannot_satisfy_evidence() -> None:
    """Loading or reading the pack must not pass for running it.

    web-design-guidelines/SKILL.md quotes the guidelines URL, visual-proof/
    SKILL.md names .visual-proof/, and capture.mjs and this hook contain every
    marker. The first receipts matched anywhere in the transcript, so loading
    the two skills closed the gate before either step ran.
    """
    pack_text = "".join(
        open(os.path.join(PACK, rel), encoding="utf-8").read()
        for rel in ("skills/web-design-guidelines/SKILL.md", "skills/visual-proof/SKILL.md",
                    "skills/visual-proof/capture.mjs", "hooks/web-excellence-stop.py"))
    body = (
        user_text(pack_text)                                       # Skill tool loads
        + tool_use("r1", "Read", {"file_path": ".claude/skills/visual-proof/capture.mjs"})
        + tool_result("r1", pack_text)                             # Read of the sources
        + tool_use("c1", "Bash", {"command": "cat .claude/skills/visual-proof/capture.mjs"})
        + tool_result("c1", pack_text)                             # cat is not a run
        + tool_use("g1", "Grep", {"pattern": GUIDELINES_URL})      # searching for the URL
        + tool_result("g1", "SKILL.md:26")
    )
    out = stop_with_transcript("skilltext", body)
    reason = (out or {}).get("reason", "")
    check("skill and source text satisfies neither receipt",
          out is not None and "web-design-guidelines" in reason and "visual-proof" in reason,
          reason or "stop hook passed")



def test_a_failed_fetch_is_not_an_audit() -> None:
    """The call alone proves nothing: a fetch that errored never retrieved the rules."""
    body = (tool_use("f1", "WebFetch", {"url": GUIDELINES_URL, "prompt": "rules"})
            + tool_result("f1", "Request failed: ETIMEDOUT", is_error=True) + SHOTS_LINE)
    out = stop_with_transcript("failedfetch", body)
    check("an errored guidelines fetch leaves the audit missing",
          out is not None and "web-design-guidelines" in out.get("reason", ""),
          (out or {}).get("reason", "stop hook passed"))

    # curl without -f also exits 0 on a rate limit or a server error.
    for i, page in enumerate(("429: Too Many Requests", "Internal Server Error",
                              "503 Service Unavailable", "400: Invalid request")):
        body = (tool_use(f"h{i}", "Bash", {"command": f"curl -sS {GUIDELINES_URL}"})
                + tool_result(f"h{i}", page) + SHOTS_LINE)
        out = stop_with_transcript(f"httperr{i}", body)
        check(f"a fetch that printed {page!r} leaves the audit missing",
              out is not None and "web-design-guidelines" in out.get("reason", ""),
              (out or {}).get("reason", "stop hook passed"))

    # An errored call whose text reads like anything else is still an error.
    body = (tool_use("f3", "WebFetch", {"url": GUIDELINES_URL, "prompt": "rules"})
            + tool_result("f3", "Request timed out after 30s", is_error=True) + SHOTS_LINE)
    out = stop_with_transcript("timedoutfetch", body)
    check("an is_error fetch with plain text leaves the audit missing",
          out is not None and "web-design-guidelines" in out.get("reason", ""),
          (out or {}).get("reason", "stop hook passed"))

    # curl without -f exits 0 and prints GitHub's 404 body as the result.
    body = (tool_use("f2", "Bash", {"command": f"curl -sS {GUIDELINES_URL}"})
            + tool_result("f2", "404: Not Found") + SHOTS_LINE)
    out = stop_with_transcript("notfoundfetch", body)
    check("a fetch that printed a 404 body leaves the audit missing",
          out is not None and "web-design-guidelines" in out.get("reason", ""),
          (out or {}).get("reason", "stop hook passed"))


def test_a_partial_capture_is_not_proof() -> None:
    """capture.mjs lists the shots it did write before reporting the gap."""
    body = AUDIT_LINE + tool_use("p1", "Bash", {"command": CAPTURE_CMD}) + tool_result(
        "p1", 'captured 5 shot(s) for "after":\n  .visual-proof/after/375-light.png\n'
        "Incomplete: 1 of 6 shot(s) failed — report them as not captured", is_error=True)
    out = stop_with_transcript("partialshots", body)
    check("a 5-of-6 matrix leaves visual proof missing",
          out is not None and "visual-proof" in out.get("reason", ""),
          (out or {}).get("reason", "stop hook passed"))


def iso(epoch: float) -> str:
    import datetime as _dt
    return _dt.datetime.fromtimestamp(epoch, _dt.timezone.utc).isoformat().replace("+00:00", "Z")


def receipts_at(ts: str) -> str:
    return (tool_use("w1", "WebFetch", {"url": GUIDELINES_URL, "prompt": "rules"}, ts)
            + tool_result("w1", "# Web Interface Guidelines", ts)
            + tool_use("w2", "Bash", {"command": CAPTURE_CMD}, ts)
            + tool_result("w2", shots(), ts))


def test_a_narrowed_capture_is_not_proof() -> None:
    """--widths/--themes can ask for less than the gate requires; exit 0 then
    proves only what was asked for."""
    one = shots(widths=("375",), themes=("light",))
    body = AUDIT_LINE + tool_use("n1", "Bash", {
        "command": CAPTURE_CMD + " --widths 375 --themes light"}) + tool_result("n1", one)
    out = stop_with_transcript("narrowshot", body)
    check("a one-shot capture does not satisfy visual proof",
          out is not None and "visual-proof" in out.get("reason", ""),
          (out or {}).get("reason", "stop hook passed"))
    light = shots(themes=("light",))
    body = AUDIT_LINE + tool_use("n2", "Bash", {"command": CAPTURE_CMD}) + tool_result("n2", light)
    out = stop_with_transcript("lightonly", body)
    check("a light-only capture does not satisfy visual proof",
          out is not None and "visual-proof" in out.get("reason", ""),
          (out or {}).get("reason", "stop hook passed"))


def test_proof_must_follow_the_last_ui_edit() -> None:
    """Screenshots taken before a final tweak show a state that no longer exists."""
    import time as _time
    with tempfile.TemporaryDirectory() as d:
        git_repo(d)
        ui = os.path.join(d, "components", "A.tsx")
        for sid, edit_offset in (("tweakafter", 60), ("tweakbefore", -60)):
            try:
                os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
            except OSError:
                pass
            run_hook(SESSION, {"session_id": sid, "cwd": d})
            write(d, "components/A.tsx", f"export const v = '{sid}';\n")
            run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": ui}})
            t = _time.time() + 5
            os.utime(ui, (t + edit_offset, t + edit_offset))
            tp = os.path.join(d, f"{sid}.jsonl")
            with open(tp, "w", encoding="utf-8") as fh:
                fh.write(receipts_at(iso(t)))
            out, _ = run_hook(STOP, {"session_id": sid, "cwd": d, "transcript_path": tp})
            reason = (out or {}).get("reason", "")
            if edit_offset > 0:
                check("a UI edit after the capture leaves the proof missing",
                      out is not None and "visual-proof" in reason, reason or "passed")
                check("the audit before that edit still counts",
                      "web-design-guidelines" not in reason, reason)
            else:
                check("a capture after the last UI edit closes the gate", out is None, reason)


def test_receipts_count_only_inside_the_window() -> None:
    """An audit run for an earlier change never covers a later one."""
    import time as _time
    stale = stop_with_transcript("stalewindow", receipts_at(iso(_time.time() - 3600)))
    check("receipts from before the first UI edit do not close the window",
          stale is not None and stale.get("decision") == "block")
    fresh = stop_with_transcript("freshwindow", receipts_at(iso(_time.time() + 5)))
    check("receipts from inside the window close it", fresh is None)


def test_a_closed_window_rearms_the_gate() -> None:
    """After a pass, the next UI change gets the reminder and needs new receipts."""
    import time as _time
    sid = "rearm"
    sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
    try:
        os.remove(sp)
    except OSError:
        pass
    with tempfile.TemporaryDirectory() as d:
        first = os.path.join(d, "first.jsonl")
        write(d, "first.jsonl", receipts_at(iso(_time.time() + 5)))
        run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/A.tsx"}})
        passed, _ = run_hook(STOP, {"session_id": sid, "transcript_path": first})
        check("the first change set closes on its receipts", passed is None)
        _time.sleep(0.05)
        again, _ = run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/B.tsx"}})
        check("the next UI edit fires the reminder again", again is not None)
        later, _ = run_hook(STOP, {"session_id": sid, "transcript_path": first})
        check("receipts made after the new window opened close it", later is None)
    with tempfile.TemporaryDirectory() as d:
        try:
            os.remove(sp)
        except OSError:
            pass
        old = os.path.join(d, "old.jsonl")
        write(d, "old.jsonl", receipts_at(iso(_time.time() - 60)))
        run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/C.tsx"}})
        blocked, _ = run_hook(STOP, {"session_id": sid, "transcript_path": old})
        check("a new window with only older receipts blocks", blocked is not None)
        follow, _ = run_hook(STOP, {"session_id": sid, "transcript_path": old, "stop_hook_active": True})
        check("the stop after the block closes the window without blocking", follow is None)
        run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/D.tsx"}})
        rearmed, _ = run_hook(STOP, {"session_id": sid, "transcript_path": old})
        check("a later UI change can block again", rearmed is not None)


def test_receipts_count_from_a_subagent_transcript() -> None:
    out = stop_with_transcript("subagent", "", subagent=AUDIT_LINE + SHOTS_LINE)
    check("an audit run by a subagent closes the gate", out is None)


def test_receipts_accept_a_shell_fetch() -> None:
    body = (tool_use("cu1", "Bash", {"command": f"curl -s {GUIDELINES_URL}"})
            + tool_result("cu1", "# Web Interface Guidelines") + SHOTS_LINE)
    check("curl of the guidelines counts as the fetch",
          stop_with_transcript("curlfetch", body) is None)


def test_receipts_rejects_failed_or_incomplete_capture() -> None:
    # Partial failure: capture.mjs exit 6 with Incomplete
    partial_shots = (tool_use("shot_part", "Bash", {"command": CAPTURE_CMD})
                     + tool_result("shot_part", 'captured 5 shot(s) for "after":\nIncomplete: 1 of 6 shot(s) failed', is_error=True))
    out = stop_with_transcript("partshot", AUDIT_LINE + partial_shots)
    check("partial screenshot capture still blocks", out is not None and "visual-proof" in (out or {}).get("reason", ""))

    # Before-only shots:
    before_shots = (tool_use("shot_bef", "Bash", {"command": CAPTURE_CMD})
                    + tool_result("shot_bef", 'captured 6 shot(s) for "before":\n  .visual-proof/before/375-light.png'))
    out_bef = stop_with_transcript("befshot", AUDIT_LINE + before_shots)
    check("before-only capture does not satisfy visual proof", out_bef is not None and "visual-proof" in (out_bef or {}).get("reason", ""))


def test_receipts_requires_successful_guidelines_fetch() -> None:
    # Fetch failed with error:
    fetch_err = (tool_use("audit_err", "WebFetch", {"url": GUIDELINES_URL, "prompt": "list rules"})
                 + tool_result("audit_err", "Error: Connection timeout", is_error=True))
    out = stop_with_transcript("fetcherr", fetch_err + SHOTS_LINE)
    check("failed fetch does not satisfy audit requirement", out is not None and "web-design-guidelines" in (out or {}).get("reason", ""))


def test_session_hook_in_subdirectory() -> None:
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, ".claude", "skills", "web-release-gate"))
        sub = os.path.join(d, "apps", "web")
        os.makedirs(sub)
        write(d, "DESIGN.md", "tokens\n")
        out, _ = run_hook(SESSION, {"cwd": sub}, env={"CLAUDE_PROJECT_DIR": d})
        ctx = (out or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
        check("session hook resolves project root from subdirectory", "WEB EXCELLENCE PACK is installed" in ctx)


def test_gate_and_stop_agree_on_ui_paths() -> None:
    """The stop hook classifies shell-edited files with a copy of the gate's regexes."""
    gate = open(GATE, encoding="utf-8").read()
    stop = open(STOP, encoding="utf-8").read()
    for name in ("UI_PATH", "NOT_UI"):
        pat = re.compile(rf"^{name} = re\.compile\(\n(.*?)\n\)$", re.S | re.M)
        a, b = pat.search(gate), pat.search(stop)
        check(f"{name} is identical in gate and stop hooks",
              bool(a and b) and a.group(1) == b.group(1))


def git_repo(d: str) -> None:
    def git(*a):
        subprocess.run(["git", "-C", d, *a], capture_output=True, check=True)
    os.makedirs(os.path.join(d, "components"))
    os.makedirs(os.path.join(d, "lib"))
    os.makedirs(os.path.join(d, ".claude", "skills", "web-release-gate"))
    for rel in ("components/A.tsx", "components/Old.tsx", "lib/x.ts"):
        with open(os.path.join(d, rel), "w") as fh:
            fh.write("export {};\n")
    git("init", "-q")
    git("config", "user.email", "t@t")
    git("config", "user.name", "t")
    git("add", "-A")
    git("commit", "-qm", "base")


def write(d: str, rel: str, text: str) -> None:
    with open(os.path.join(d, rel), "w") as fh:
        fh.write(text)


def test_stop_sees_ui_edits_made_through_the_shell() -> None:
    """A UI file rewritten by sed or a heredoc never reaches the PreToolUse matcher."""
    with tempfile.TemporaryDirectory() as d:
        git_repo(d)
        write(d, "components/Old.tsx", "export const dirtyBeforeSession = 1;\n")

        def session(sid):
            try:
                os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
            except OSError:
                pass
            run_hook(SESSION, {"session_id": sid, "cwd": d})

        def stop(sid, cwd=d):
            out, _ = run_hook(STOP, {"session_id": sid, "cwd": cwd, "transcript_path": "/nope"})
            return out

        session("shellquiet")
        write(d, "lib/x.ts", "export const notUi = 2;\n")
        check("pre-existing dirty UI file and a non-UI edit do not block",
              stop("shellquiet") is None)

        session("shelledit")
        write(d, "components/A.tsx", "export const viaSed = 1;\n")
        out = stop("shelledit", cwd=os.path.join(d, "components"))
        reason = (out or {}).get("reason", "")
        check("a UI file changed outside Edit/Write blocks the stop",
              out is not None and "components/A.tsx" in reason, reason or "passed")
        check("the file that was dirty before the session is not blamed",
              "components/Old.tsx" not in reason, reason)

        session("shellagain")
        write(d, "components/Old.tsx", "export const editedAgainThisSession = 2;\n")
        out = stop("shellagain")
        check("a pre-dirty UI file edited again this session blocks",
              out is not None and "components/Old.tsx" in out.get("reason", ""))

        session("shellcommit")
        write(d, "components/A.tsx", "export const committedViaBash = 3;\n")
        subprocess.run(["git", "-C", d, "commit", "-am", "commit via bash"], capture_output=True, check=True)
        out = stop("shellcommit")
        check("a committed UI edit made this session blocks",
              out is not None and "components/A.tsx" in (out or {}).get("reason", ""))

        try:
            os.remove(os.path.join(tempfile.gettempdir(), "web-gate-nobaseline.json"))
        except OSError:
            pass
        check("no baseline recorded means no shell-edit check",
              stop("nobaseline") is None)



def test_committed_shell_edits_count_and_pulls_do_not() -> None:
    """A UI file rewritten by a shell command and committed in the same turn.

    The reflog tells a commit made here from one a merge or pull brought in.
    """
    def git(d, *a):
        subprocess.run(["git", "-C", d, *a], capture_output=True, check=True)

    with tempfile.TemporaryDirectory() as d:
        git_repo(d)
        git(d, "checkout", "-qb", "upstream")
        write(d, "components/Theirs.tsx", "export const theirs = 1;\n")
        git(d, "add", "-A")
        git(d, "commit", "-qm", "someone else's UI change")
        git(d, "checkout", "-q", "-")

        sid = "committedshell"
        try:
            os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
        except OSError:
            pass
        run_hook(SESSION, {"session_id": sid, "cwd": d})
        # No sleep: commits are found by reflog position, so one made in the
        # same second the session started still counts.
        git(d, "merge", "-q", "--ff-only", "upstream")
        out, _ = run_hook(STOP, {"session_id": sid, "cwd": d, "transcript_path": "/nope"})
        check("a fast-forward pull of someone else's UI commit does not block", out is None,
              (out or {}).get("reason", ""))

        write(d, "components/A.tsx", "export const viaHeredoc = 1;\n")
        git(d, "commit", "-qam", "agent: restyle A")
        out, _ = run_hook(STOP, {"session_id": sid, "cwd": d, "transcript_path": "/nope"})
        reason = (out or {}).get("reason", "")
        check("a UI file committed from the shell this session blocks",
              out is not None and "components/A.tsx" in reason, reason or "passed")
        check("the pulled file is not blamed", "components/Theirs.tsx" not in reason, reason)



def test_commits_after_a_closed_window_still_count() -> None:
    """Closing a window moves the reflog mark: later commits count, earlier ones
    are not blamed again."""
    def git(d, *a):
        subprocess.run(["git", "-C", d, *a], capture_output=True, check=True)

    with tempfile.TemporaryDirectory() as d:
        git_repo(d)
        sid = "windowcommits"
        try:
            os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
        except OSError:
            pass
        run_hook(SESSION, {"session_id": sid, "cwd": d})
        stop = {"session_id": sid, "cwd": d, "transcript_path": "/nope"}

        write(d, "components/A.tsx", "export const first = 1;\n")
        git(d, "commit", "-qam", "agent: first change")
        out, _ = run_hook(STOP, stop)
        check("the first committed change blocks", out is not None)
        run_hook(STOP, dict(stop, stop_hook_active=True))  # closes the window

        write(d, "components/Old.tsx", "export const second = 2;\n")
        git(d, "commit", "-qam", "agent: second change")
        out, _ = run_hook(STOP, stop)
        reason = (out or {}).get("reason", "")
        check("a commit after the window closed blocks",
              out is not None and "components/Old.tsx" in reason, reason or "passed")
        check("the earlier window's commit is not blamed again",
              "components/A.tsx" not in reason, reason)


def test_session_below_the_repo_root_still_records_a_baseline() -> None:
    """SessionStart can fire with cwd = <repo>/components after a resume."""
    with tempfile.TemporaryDirectory() as d:
        git_repo(d)
        sid = "subdirsession"
        sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
        try:
            os.remove(sp)
        except OSError:
            pass
        out, _ = run_hook(SESSION, {"session_id": sid, "cwd": os.path.join(d, "components")})
        check("the pack note is still injected from a subdirectory", out is not None)
        state = json.load(open(sp)) if os.path.exists(sp) else {}
        roots = [os.path.realpath(r) for r in (state.get("baseline") or {})]
        check("the baseline is recorded for the repo root", os.path.realpath(d) in roots, str(roots))

    # A worktree session whose CLAUDE_PROJECT_DIR names the main checkout: the
    # stop hook keys baselines by the checkout it runs in, so that one wins.
    with tempfile.TemporaryDirectory() as main_co, tempfile.TemporaryDirectory() as tree:
        git_repo(main_co)
        git_repo(tree)
        sid = "worktreesession"
        sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
        try:
            os.remove(sp)
        except OSError:
            pass
        run_hook(SESSION, {"session_id": sid, "cwd": tree}, env={"CLAUDE_PROJECT_DIR": main_co})
        state = json.load(open(sp)) if os.path.exists(sp) else {}
        roots = [os.path.realpath(r) for r in (state.get("baseline") or {})]
        check("the session's own checkout wins over CLAUDE_PROJECT_DIR",
              roots == [os.path.realpath(tree)], str(roots))


def test_a_shell_rename_out_of_a_ui_path_counts() -> None:
    """`git mv app/page.tsx archive/page.tsx` changes a UI path whose new name is not one."""
    with tempfile.TemporaryDirectory() as d:
        git_repo(d)
        sid = "shellrename"
        try:
            os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
        except OSError:
            pass
        run_hook(SESSION, {"session_id": sid, "cwd": d})
        os.makedirs(os.path.join(d, "archive"))
        subprocess.run(["git", "-C", d, "mv", "components/A.tsx", "archive/A.tsx"],
                       capture_output=True, check=True)
        out, _ = run_hook(STOP, {"session_id": sid, "cwd": d, "transcript_path": "/nope"})
        reason = (out or {}).get("reason", "")
        check("moving a UI file away blocks, naming its old path",
              out is not None and "components/A.tsx" in reason, reason or "passed")


def test_hook_commands_use_the_documented_placeholder() -> None:
    """`${CLAUDE_PROJECT_DIR:-.}` is POSIX shell, not the placeholder Claude Code substitutes."""
    snippet = json.load(open(os.path.join(PACK, "settings.snippet.json"), encoding="utf-8"))
    cmds = [h["command"] for es in snippet["hooks"].values() for e in es for h in e["hooks"]]
    check("every command uses the exact ${CLAUDE_PROJECT_DIR} placeholder",
          all('"${CLAUDE_PROJECT_DIR}/.claude/hooks/' in c for c in cmds), str(cmds))


def test_capture_exits_nonzero_on_a_partial_matrix() -> None:
    """One good phone shot must not pass for failed desktop and dark captures."""
    if not shutil.which("node"):
        print("  skip capture test (node not available)")
        return
    stub = """
import { writeFileSync } from 'node:fs';
const failWidth = Number(process.env.FAIL_WIDTH || 0);
export const chromium = { launch: async () => ({
  newContext: async (opts) => ({
    newPage: async () => ({
      goto: async () => { if (opts.viewport.width === failWidth) throw new Error('boom'); },
      evaluate: async () => false,
      waitForTimeout: async () => {},
      screenshot: async ({ path }) => writeFileSync(path, ''),
    }),
    close: async () => {},
  }),
  close: async () => {},
}) };
"""
    with tempfile.TemporaryDirectory() as d:
        mod = os.path.join(d, "node_modules", "playwright")
        os.makedirs(mod)
        write(mod, "package.json", '{"name":"playwright","type":"module","main":"index.js"}')
        write(mod, "index.js", stub)
        src = open(os.path.join(PACK, "skills", "visual-proof", "capture.mjs"), encoding="utf-8").read()
        write(d, "capture.mjs", src)

        def capture(fail_width):
            env = dict(os.environ, FAIL_WIDTH=str(fail_width))
            return subprocess.run(["node", "capture.mjs", "--url", "http://x.test/", "--label", "t"],
                                  cwd=d, capture_output=True, text=True, env=env)

        full = capture(0)
        check("a complete matrix exits 0", full.returncode == 0, full.stderr)
        part = capture(768)
        check("a partial matrix exits non-zero",
              part.returncode == 6 and "Incomplete: 2 of 6" in part.stderr, part.stderr)


def test_stop_opt_out() -> None:
    sid = "optouttest"
    try:
        os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
    except OSError:
        pass
    run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/E.tsx"}})
    out, _ = run_hook(STOP, {"session_id": sid, "transcript_path": "/nope"}, env={"WEB_GATE_NO_STOP": "1"})
    check("WEB_GATE_NO_STOP=1 disables the stop gate", out is None)


def test_stop_never_chains() -> None:
    sid = "chaintest"
    try:
        os.remove(os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json"))
    except OSError:
        pass
    run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/F.tsx"}})
    out, _ = run_hook(STOP, {"session_id": sid, "transcript_path": "/nope", "stop_hook_active": True})
    check("stop_hook_active short-circuits (no loop)", out is None)


def test_session_hook_silent_without_pack() -> None:
    with tempfile.TemporaryDirectory() as d:
        out, code = run_hook(SESSION, {"cwd": d})
        check("session hook silent where the pack is not installed", out is None and code == 0)


def test_session_hook_finds_uppercase_contracts() -> None:
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, ".claude", "skills", "web-release-gate"))
        open(os.path.join(d, "DESIGN.md"), "w").close()
        open(os.path.join(d, "TASTE.md"), "w").close()
        out, _ = run_hook(SESSION, {"cwd": d})
        ctx = (out or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
        check("session hook detects DESIGN.md / TASTE.md regardless of case",
              "DESIGN.md" in ctx and "TASTE.md" in ctx)


def test_state_file_is_private() -> None:
    if sys.platform == "win32":
        print("  skip permission test (Windows NTFS does not use POSIX 0600 mode bits)")
        return
    sid = "permtest"
    sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
    try:
        os.remove(sp)
    except OSError:
        pass
    run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/G.tsx"}})
    mode = os.stat(sp).st_mode & 0o777
    check("state file is 0600", mode == 0o600, f"got {oct(mode)}")


def test_state_file_refuses_a_planted_symlink() -> None:
    """A symlink pre-planted at the predictable state path must not be followed.

    0o600 protects the content once the file is ours, but O_CREAT|O_TRUNC alone
    happily truncates through a symlink another local user planted first. The
    temp dir is world-writable and the path is guessable, so that is a real
    write-anywhere primitive on a shared host.
    """
    if not hasattr(os, "O_NOFOLLOW"):
        print("  skip symlink test (no O_NOFOLLOW on this platform)")
        return
    sid = "symlinktest"
    sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
    with tempfile.TemporaryDirectory() as d:
        victim = os.path.join(d, "victim.txt")
        with open(victim, "w") as fh:
            fh.write("do not clobber me")
        try:
            os.remove(sp)
        except OSError:
            pass
        os.symlink(victim, sp)
        try:
            run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/S.tsx"}})
            check("planted symlink target is untouched",
                  open(victim).read() == "do not clobber me")
            check("the symlink itself was not replaced by real state",
                  os.path.islink(sp))
        finally:
            try:
                os.remove(sp)
            except OSError:
                pass


def test_session_id_is_sanitized() -> None:
    out, _ = run_hook(GATE, {"session_id": "../../etc/pwn", "tool_input": {"file_path": "components/H.tsx"}})
    escaped = os.path.exists("/tmp/etc/pwn.json") or os.path.exists(
        os.path.join(tempfile.gettempdir(), "..", "..", "etc", "pwn.json")
    )
    check("path-traversal session_id cannot escape the temp dir", not escaped)


def test_linter_ratchet() -> None:
    if not shutil.which("node"):
        print("  skip node linter tests (node not available)")
        return
    with tempfile.TemporaryDirectory() as d:
        def git(*a):
            subprocess.run(["git", "-C", d, *a], capture_output=True, check=False)

        os.makedirs(os.path.join(d, "components"))
        legacy = os.path.join(d, "components", "Legacy.tsx")
        open(legacy, "w").write('export const A = () => <div className="transition-all">old</div>;\n')
        git("init", "-q"); git("config", "user.email", "t@t"); git("config", "user.name", "t")
        git("add", "-A"); git("commit", "-qm", "base"); git("branch", "-M", "main")
        git("checkout", "-qb", "feature")
        open(legacy, "w").write(
            'const x = 1;\nexport const A = () => <div className="transition-all">old</div>;\n')
        open(os.path.join(d, "components", "New.tsx"), "w").write(
            'export const B = () => <span onClick={() => {}}>bad</span>;\n')
        git("add", "-A"); git("commit", "-qm", "feature")

        r = subprocess.run([ "node", LINT, "--changed", "--base", "main"],
                           cwd=d, capture_output=True, text=True)
        check("ratchet flags a newly added violation", "New.tsx" in r.stdout and r.returncode == 1)
        check("ratchet ignores a pre-existing violation in a touched file",
              "Legacy.tsx" not in r.stdout, r.stdout)

        r2 = subprocess.run(["node", LINT, "--changed", "--base", "main", "--all-lines"],
                            cwd=d, capture_output=True, text=True)
        check("--all-lines does report the pre-existing violation", "Legacy.tsx" in r2.stdout)


def test_linter_div_onclick_exempts_keyboard_path() -> None:
    """A div with onClick is only an error when there is no keyboard path.

    Flagging the deliberate accessible pattern (modal backdrop with role +
    tabIndex + onKeyDown) is how a rule earns itself a blanket disable.
    """
    if not shutil.which("node"):
        print("  skip node linter tests (node not available)")
        return
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, "components"))
        open(os.path.join(d, "components", "Bare.tsx"), "w").write(
            'export const A = () => <div onClick={close}>x</div>;\n')
        open(os.path.join(d, "components", "Backdrop.tsx"), "w").write(
            'export const B = () => <div role="button" tabIndex={0} '
            'onKeyDown={onKey} onClick={close}>x</div>;\n')
        r = subprocess.run(
            ["node", LINT, "components/Bare.tsx", "components/Backdrop.tsx"],
            cwd=d, capture_output=True, text=True)
        check("bare div+onClick is still an error", "Bare.tsx" in r.stdout and r.returncode == 1)
        check("accessible div+onClick is exempt", "Backdrop.tsx" not in r.stdout, r.stdout)


def test_linter_sees_multiline_jsx_tags() -> None:
    """Prettier splits a tag with several props across lines.

    Matching one physical line at a time missed exactly that shape, so the
    accessibility rule looked stronger than it was on real formatted code.
    """
    if not shutil.which("node"):
        return
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, "components"))
        open(os.path.join(d, "components", "Split.tsx"), "w").write(
            "export const A = () => (\n"
            "  <div\n"
            '    className="backdrop"\n'
            "    onClick={close}\n"
            "  >\n"
            "    x\n"
            "  </div>\n"
            ");\n")
        open(os.path.join(d, "components", "SplitOk.tsx"), "w").write(
            "export const B = () => (\n"
            "  <div\n"
            '    role="button"\n'
            "    tabIndex={0}\n"
            "    onKeyDown={onKey}\n"
            "    onClick={close}\n"
            "  >\n"
            "    x\n"
            "  </div>\n"
            ");\n")
        open(os.path.join(d, "components", "SplitImg.tsx"), "w").write(
            "export const C = () => (\n"
            "  <img\n"
            '    src="/a.png"\n'
            '    alt="a"\n'
            "  />\n"
            ");\n")
        r = subprocess.run(
            ["node", LINT, "components/Split.tsx", "components/SplitOk.tsx",
             "components/SplitImg.tsx"],
            cwd=d, capture_output=True, text=True)
        check("multi-line div+onClick is caught", "Split.tsx:2" in r.stdout, r.stdout)
        check("multi-line img without dimensions is caught",
              "SplitImg.tsx:2" in r.stdout, r.stdout)
        check("multi-line accessible div is still exempt",
              "SplitOk.tsx" not in r.stdout, r.stdout)


def test_workflow_filters_are_not_root_anchored() -> None:
    """A `paths:` glob without a leading `**/` only matches at the repo root.

    The first cut listed `app/**`, `src/**`, `components/**`… — none of which
    exist at the root of a monorepo like arcanea (apps/web/app, arcanea.ai/app).
    The job silently never ran on a .tsx-only PR. Filter by extension instead;
    which directories count is the linter's job, not the workflow's.
    """
    wf = open(os.path.join(PACK, "ci", "web-excellence.yml"), encoding="utf-8").read()
    paths = re.findall(r"^\s+- '([^']+)'", wf, re.M)
    check("workflow declares path filters", bool(paths))
    bad = [p for p in paths
           if not p.startswith("**/") and not os.path.splitext(p)[1] in ("", ".yml", ".mjs")]
    check("no root-anchored directory glob", not bad, f"root-anchored: {bad}")
    exts = {p[3:] for p in paths if p.startswith("**/*.")}
    lint = open(LINT, encoding="utf-8").read()
    ui_ext = re.search(r"const UI_EXT = /\\\.\(([^)]+)\)", lint).group(1).split("|")
    missing = [e for e in ui_ext if f"*.{e}" not in exts]
    check("every extension the linter checks is also a workflow trigger",
          not missing, f"linter checks {missing} but CI would not fire on them")


def test_capture_label_cannot_escape_the_output_dir() -> None:
    """--label becomes a path segment; it must stay a single segment."""
    src = open(os.path.join(PACK, "skills", "visual-proof", "capture.mjs"),
               encoding="utf-8").read()
    m = re.search(r"const label = (.+);", src)
    check("label is sanitized before use as a path segment",
          bool(m) and "replace(" in m.group(1), m.group(1) if m else "not found")


def test_linter_survives_a_hostile_base_ref() -> None:
    """`base` reaches git as argv, not as a shell string."""
    if not shutil.which("node"):
        return
    with tempfile.TemporaryDirectory() as d:
        canary = os.path.join(d, "pwned")
        r = subprocess.run(
            ["node", LINT, "--changed", "--base", f"main; touch {canary}"],
            cwd=d, capture_output=True, text=True)
        check("hostile --base does not reach a shell",
              not os.path.exists(canary) and r.returncode == 2, r.stderr.strip())


def test_installer_upgrades_an_old_install() -> None:
    """Re-running install.sh must move old hook commands, not add second copies.

    Hooks run in the session's current directory, so the commands are anchored
    to ${CLAUDE_PROJECT_DIR}. Matching ours by exact command string would leave
    every relative entry from an older install in place beside the new one, and
    each hook would then run twice.
    """
    old_cmd = "python3 .claude/hooks/web-excellence-{}.py"
    settings = {"hooks": {
        "SessionStart": [{"matcher": ".*", "hooks": [
            {"type": "command", "command": old_cmd.format("session"), "timeout": 10}]}],
        "PreToolUse": [
            {"matcher": "Bash", "hooks": [{"type": "command", "command": "python3 .claude/hooks/other.py"}]},
            {"matcher": "Edit|Write|MultiEdit|NotebookEdit", "hooks": [
                {"type": "command", "command": old_cmd.format("gate"), "timeout": 10}]}],
        "Stop": [{"hooks": [{"type": "command", "command": old_cmd.format("stop"), "timeout": 15}]}],
    }}
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, ".claude"))
        write(d, ".claude/settings.json", json.dumps(settings))
        write(d, ".gitignore", "node_modules/\n\n# web-excellence pack — local evidence, not repo artifacts\n"
                               ".visual-proof/\n.lighthouse.json\n.extract-design-system/\n.claude/skills/.replaced/\n")
        for _ in range(2):
            r = subprocess.run([BASH, os.path.join(PACK, "install.sh"), d, "--no-db", "--no-ci"],
                               capture_output=True, text=True, encoding="utf-8", errors="replace")
        check("installer runs", r.returncode == 0, r.stderr)
        got = json.load(open(os.path.join(d, ".claude", "settings.json")))
        cmds = [h["command"] for ev in got["hooks"].values() for e in ev for h in e["hooks"]]
        for name in ("session", "gate", "stop"):
            mine = [c for c in cmds if f"web-excellence-{name}.py" in c]
            check(f"exactly one {name} hook, anchored to the project root",
                  len(mine) == 1 and "${CLAUDE_PROJECT_DIR" in mine[0], str(mine))
        check("unrelated hooks are kept", "python3 .claude/hooks/other.py" in cmds)
        gi = open(os.path.join(d, ".gitignore")).read().splitlines()
        check("new ignore lines reach a repo installed by an older version",
              gi.count(".claude/skills/**/__pycache__/") == 1 and gi.count(".visual-proof/") == 1, str(gi))


def test_installer_keeps_a_repo_tuned_workflow() -> None:
    """A repo's own edits to the CI workflow (action pins, draft gating) survive a re-install."""
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, ".github", "workflows"))
        tuned = "name: Web excellence\n# repo-tuned: draft gate, pinned actions\n"
        write(d, ".github/workflows/web-excellence.yml", tuned)
        r = subprocess.run([BASH, os.path.join(PACK, "install.sh"), d, "--no-db"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        kept = open(os.path.join(d, ".github", "workflows", "web-excellence.yml")).read()
        check("a differing workflow is kept and reported",
              r.returncode == 0 and kept == tuned and "keep   .github/workflows/web-excellence.yml" in r.stdout,
              r.stdout[-300:])
    with tempfile.TemporaryDirectory() as d:
        subprocess.run([BASH, os.path.join(PACK, "install.sh"), d, "--no-db"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
        check("a missing workflow is installed",
              os.path.exists(os.path.join(d, ".github", "workflows", "web-excellence.yml")))


if __name__ == "__main__":
    print("web-excellence hook tests\n")
    for fn in [v for k, v in sorted(globals().items()) if k.startswith("test_")]:
        print(fn.__name__)
        fn()
    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED: {', '.join(failures)}")
        sys.exit(1)
    print("all checks passed")
