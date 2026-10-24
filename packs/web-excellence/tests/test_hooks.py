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


AUDIT_LINE = ("fetched https://raw.githubusercontent.com/vercel-labs/"
              "web-interface-guidelines/main/command.md\n")


def stop_with_transcript(sid: str, body: str):
    """Arm the gate for `sid`, then run the Stop hook against a fake transcript."""
    sp = os.path.join(tempfile.gettempdir(), f"web-gate-{sid}.json")
    try:
        os.remove(sp)
    except OSError:
        pass
    run_hook(GATE, {"session_id": sid, "tool_input": {"file_path": "components/X.tsx"}})
    with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as fh:
        fh.write(body)
        path = fh.name
    out, _ = run_hook(STOP, {"session_id": sid, "transcript_path": path})
    os.unlink(path)
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

    visual_only = stop_with_transcript("bothvisual", "wrote 6 shot(s) for /pricing\n")
    check("visual proof without an audit still blocks",
          visual_only is not None and visual_only.get("decision") == "block")

    both = stop_with_transcript("bothdone", AUDIT_LINE + "wrote 6 shot(s) for /pricing\n")
    check("gate closes when both halves ran", both is None)

    excused = stop_with_transcript(
        "bothexcused", AUDIT_LINE + "cannot capture: no dev server on :3000\n")
    check("an honest 'cannot capture' counts as visual proof", excused is None)


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
    if subprocess.run(["which", "node"], capture_output=True).returncode != 0:
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
    if subprocess.run(["which", "node"], capture_output=True).returncode != 0:
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
    if subprocess.run(["which", "node"], capture_output=True).returncode != 0:
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
    if subprocess.run(["which", "node"], capture_output=True).returncode != 0:
        return
    with tempfile.TemporaryDirectory() as d:
        canary = os.path.join(d, "pwned")
        r = subprocess.run(
            ["node", LINT, "--changed", "--base", f"main; touch {canary}"],
            cwd=d, capture_output=True, text=True)
        check("hostile --base does not reach a shell",
              not os.path.exists(canary) and r.returncode == 2, r.stderr.strip())


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
