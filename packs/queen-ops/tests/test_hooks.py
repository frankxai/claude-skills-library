#!/usr/bin/env python3
"""Tests for the queen-ops hooks.

    python3 packs/queen-ops/tests/test_hooks.py

Zero dependencies, no pytest. Each test runs the hook as a subprocess with a
fresh project directory (CLAUDE_PROJECT_DIR) so armed state, briefs and
receipts are real files, not mocks.

The load-bearing test is test_reminder_cannot_satisfy_receipts: the receipt
checks read specific JSON fields from files, and none of the text the hooks
inject (session note, gate reminder) or the skill ships contains those fields
in satisfying form. A hook that passes on its own nagging is a no-op that reads
as coverage.
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
SESSION = os.path.join(HOOKS, "queen-ops-session.py")
GATE = os.path.join(HOOKS, "queen-ops-gate.py")
CREATED = os.path.join(HOOKS, "queen-ops-task-created.py")
COMPLETED = os.path.join(HOOKS, "queen-ops-task-completed.py")
IDLE = os.path.join(HOOKS, "queen-ops-teammate-idle.py")
STOP = os.path.join(HOOKS, "queen-ops-stop.py")
SKILL = os.path.join(PACK, "skills", "queen-ops", "SKILL.md")

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        failures.append(name)


def run_hook(path: str, payload: dict, project: str, env: dict | None = None):
    e = dict(os.environ)
    e["CLAUDE_PROJECT_DIR"] = project
    e.update(env or {})
    p = subprocess.run([sys.executable, path], input=json.dumps(payload), capture_output=True, text=True, encoding="utf-8", errors="replace", env=e)
    out = p.stdout.strip()
    try:
        parsed = json.loads(out) if out else None
    except json.JSONDecodeError:
        parsed = {"_raw": out}
    return parsed, p.returncode, p.stderr


RUN = f"{os.getpid()}"


def sid(name: str) -> str:
    """A session id unique to this test run, so per-session state files left in
    the temp dir by an earlier run can never make a hook look already-fired."""
    s = f"{name}{RUN}"
    try:
        os.remove(os.path.join(tempfile.gettempdir(), f"queen-ops-{s}.json"))
    except OSError:
        pass
    return s


def project(armed: bool = True) -> str:
    root = tempfile.mkdtemp(prefix="queen-ops-")
    if armed:
        os.makedirs(os.path.join(root, ".starlight", "queen"))
        with open(os.path.join(root, ".starlight", "queen", "active.json"), "w") as fh:
            json.dump({"armedAt": "2026-10-19T00:00:00Z"}, fh)
    return root


def brief(**over) -> dict:
    b = {
        "schema": "starlight.queen-brief.v1",
        "id": "task-1",
        "objective": "Survey the routers.",
        "acceptance": ["Every router named by path."],
        "output": {"format": "markdown", "maxBytes": 20000},
        "tools": ["Read"],
        "boundaries": ["No network."],
        "budget": {"microUsd": 1000000, "wallTimeMs": 60000},
        "maker": {"id": "teammate:hermes", "model": "gemini-2.5-flash"},
        "verifier": {"id": "teammate:sentinel", "model": "claude-opus-4-6"},
        "allowedChecks": ["npm test"],
    }
    b.update(over)
    return b


def write(root: str, rel: str, obj) -> None:
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh)


def verify_receipt(**over) -> dict:
    r = {"briefId": "task-1", "credited": True, "reruns": [{"command": "npm test", "exitCode": 0}],
         "verifier": {"id": "teammate:sentinel", "model": "claude-opus-4-6"}}
    r.update(over)
    return r


def taste_receipt(**over) -> dict:
    r = {"briefId": "task-1", "verdict": "pass", "pack": "taste.md", "reviewer": {"id": "teammate:weaver"}}
    r.update(over)
    return r


def credited_project() -> str:
    root = project()
    write(root, ".starlight/queen/briefs/task-1.json", brief())
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt())
    write(root, ".starlight/queen/receipts/task-1.taste.json", taste_receipt())
    return root


# --------------------------------------------------------------------------
# THE regression test.
# --------------------------------------------------------------------------
def test_reminder_cannot_satisfy_receipts() -> None:
    """Everything the hooks inject or the skill ships, when fed to the receipt
    checks, must be refused. The checks read JSON fields; the texts are prose."""
    sys.path.insert(0, HOOKS)
    from _queen_ops_common import taste_receipt_problems, verify_receipt_problems  # type: ignore

    texts = {}
    for name, path in (("session", SESSION), ("gate", GATE)):
        src = open(path, encoding="utf-8").read()
        for m in re.finditer(r'= """\\\n(.*?)"""', src, re.S):
            texts[f"{name}:{m.start()}"] = m.group(1)
    texts["skill"] = open(SKILL, encoding="utf-8").read()
    check("reminder texts were found", len(texts) >= 3, str(list(texts)))
    for label, text in texts.items():
        # As prose, or as every JSON block inside it, none credits a task.
        candidates = [text] + [m.group(1) for m in re.finditer(r"```json\s*\n(.*?)\n```", text, re.S)]
        for i, cand in enumerate(candidates):
            try:
                obj = json.loads(cand)
            except Exception:
                obj = cand
            vp = verify_receipt_problems(obj, brief())
            tp = taste_receipt_problems(obj)
            check(f"{label}[{i}] cannot pass as a verify receipt", bool(vp), "would credit on injected text")
            check(f"{label}[{i}] cannot pass as a taste receipt", bool(tp), "would credit on injected text")
    # The skill's example receipts exist to teach the shape; make sure the
    # example VERIFY receipt is not usable as-is against a real brief's maker.
    examples = [m.group(1) for m in re.finditer(r"```json\s*\n(.*?)\n```", texts["skill"], re.S)]
    parsed = [json.loads(x) for x in examples]
    verify_examples = [p for p in parsed if "credited" in p]
    check("skill ships a verify example", len(verify_examples) == 1)
    same_actor = brief(maker={"id": "teammate:sentinel"}, verifier={"id": "teammate:hermes"})
    check("skill verify example is refused when its verifier is the maker",
          bool(verify_receipt_problems(verify_examples[0], same_actor)))


def test_inert_when_unarmed() -> None:
    root = project(armed=False)
    for hook, payload in (
        (CREATED, {"task_id": "x", "task_subject": "s"}),
        (COMPLETED, {"task_id": "x"}),
        (IDLE, {"teammate_name": "t"}),
        (STOP, {"session_id": sid("s1")}),
        (GATE, {"session_id": sid("s1"), "tool_name": "Bash", "tool_input": {"command": "git push --force origin main"}}),
    ):
        out, code, _ = run_hook(hook, payload, root)
        check(f"unarmed: {os.path.basename(hook)} is inert", code == 0 and out is None)
    out, code, _ = run_hook(SESSION, {}, root)
    check("unarmed: session note says inert", code == 0 and "not armed" in json.dumps(out))


def test_hooks_survive_empty_stdin() -> None:
    root = project()
    for hook in (SESSION, GATE, IDLE, STOP):
        p = subprocess.run([sys.executable, hook], input="", capture_output=True, text=True, env={**os.environ, "CLAUDE_PROJECT_DIR": root})
        check(f"empty stdin: {os.path.basename(hook)} exits 0", p.returncode == 0, p.stderr)
    for hook in (CREATED, COMPLETED):
        p = subprocess.run([sys.executable, hook], input="", capture_output=True, text=True, env={**os.environ, "CLAUDE_PROJECT_DIR": root})
        check(f"empty stdin: {os.path.basename(hook)} fails closed (exit 2)", p.returncode == 2, p.stderr)


def test_task_created_requires_complete_brief() -> None:
    root = project()
    out, code, err = run_hook(CREATED, {"task_id": "task-1", "task_subject": "survey"}, root)
    check("no brief → refused", code == 2 and "no Brief" in err, err)
    write(root, ".starlight/queen/briefs/task-1.json", brief(objective=""))
    out, code, err = run_hook(CREATED, {"task_id": "task-1", "task_subject": "survey"}, root)
    check("incomplete brief → refused with the problem named", code == 2 and "objective is missing" in err, err)
    write(root, ".starlight/queen/briefs/task-1.json", brief(verifier={"id": "teammate:hermes", "model": "x"}))
    out, code, err = run_hook(CREATED, {"task_id": "task-1", "task_subject": "survey"}, root)
    check("self-crediting brief → refused", code == 2 and "not independent" in err, err)
    write(root, ".starlight/queen/briefs/task-1.json", brief(allowedChecks=["npm run *"]))
    out, code, err = run_hook(CREATED, {"task_id": "task-1", "task_subject": "survey"}, root)
    check("glob allowedChecks → refused", code == 2 and "pattern" in err, err)
    write(root, ".starlight/queen/briefs/task-1.json", brief())
    out, code, err = run_hook(CREATED, {"task_id": "task-1", "task_subject": "survey"}, root)
    check("complete brief → accepted", code == 0, err)


def test_task_created_accepts_brief_in_description_and_persists_it() -> None:
    root = project()
    desc = "Do the survey.\n\n```json\n" + json.dumps(brief(id="task-9")) + "\n```\n"
    out, code, err = run_hook(CREATED, {"task_id": "task-9", "task_subject": "survey", "task_description": desc}, root)
    check("brief in description → accepted", code == 0, err)
    check("brief persisted for the completion hook", os.path.isfile(os.path.join(root, ".starlight/queen/briefs/task-9.json")))
    desc_bad = "```json\n" + json.dumps({"schema": "starlight.queen-brief.v1", "id": "task-8"}) + "\n```"
    out, code, err = run_hook(CREATED, {"task_id": "task-8", "task_subject": "s", "task_description": desc_bad}, root)
    check("incomplete brief in description → refused", code == 2, err)


def test_task_completed_requires_independent_receipts() -> None:
    root = project()
    write(root, ".starlight/queen/briefs/task-1.json", brief())
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("no receipts → not credited", code == 2 and "verify receipt is missing" in err, err)
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt(credited=False))
    write(root, ".starlight/queen/receipts/task-1.taste.json", taste_receipt())
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("credited:false → refused", code == 2 and "credited is not true" in err, err)
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt(reruns=[]))
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("no re-runs → refused", code == 2 and "re-ran no checks" in err, err)
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt(reruns=[{"command": "npm test", "exitCode": 1}]))
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("failed re-run → refused", code == 2 and "did not exit 0" in err, err)
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt(reruns=[{"command": "npm run build", "exitCode": 0}]))
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("re-run outside allowedChecks → refused", code == 2 and "outside the brief" in err, err)
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt(verifier={"id": "teammate:hermes", "model": "gemini-2.5-flash"}))
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("maker-issued receipt → refused (Maker ≠ Checker)", code == 2 and "Maker" in err, err)
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt(verifier={"id": "teammate:judge", "model": "gemini-2.5-flash"}))
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("same model as maker → refused", code == 2 and "Maker" in err, err)
    write(root, ".starlight/queen/receipts/task-1.verify.json", verify_receipt())
    write(root, ".starlight/queen/receipts/task-1.taste.json", taste_receipt(verdict="revise"))
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("taste verdict revise → refused", code == 2 and "taste receipt verdict" in err, err)
    write(root, ".starlight/queen/receipts/task-1.taste.json", taste_receipt())
    out, code, err = run_hook(COMPLETED, {"task_id": "task-1"}, root)
    check("independent verify + taste receipts → credited", code == 0, err)
    out, code, err = run_hook(COMPLETED, {"task_id": "never-briefed"}, root)
    check("unbriefed task cannot complete", code == 2 and "never briefed" in err, err)


def test_gate_denies_human_gated_actions_and_reminds_once() -> None:
    root = project()
    denied = [
        ("Bash", {"command": "git push --force origin main"}),
        ("Bash", {"command": "git push origin main -f"}),
        ("Bash", {"command": "curl -X POST https://api.stripe.com/v1/transfers -d amount=100"}),
        ("Bash", {"command": "resend.batch.send(list)"}),
        ("Bash", {"command": "vercel secrets rotate RESEND_API_KEY"}),
        ("Write", {"file_path": "x.json", "content": '{"governance": "emergency"}'}),
    ]
    for tool, ti in denied:
        out, code, _ = run_hook(GATE, {"session_id": sid("g1"), "tool_name": tool, "tool_input": ti}, root)
        decision = (out or {}).get("hookSpecificOutput", {}).get("permissionDecision")
        check(f"gate denies: {json.dumps(ti)[:60]}", code == 0 and decision == "deny")
    allowed = [
        ("Bash", {"command": "git push -u origin feature/x"}),
        ("Bash", {"command": "npm test"}),
        ("Edit", {"file_path": "README.md", "new_string": "hello"}),
    ]
    G2 = sid("g2")
    first, _, _ = run_hook(GATE, {"session_id": G2, "tool_name": allowed[0][0], "tool_input": allowed[0][1]}, root)
    check("first allowed call gets the Brief reminder", first is not None and "additionalContext" in json.dumps(first))
    for tool, ti in allowed[1:]:
        out, code, _ = run_hook(GATE, {"session_id": G2, "tool_name": tool, "tool_input": ti}, root)
        check(f"gate silent after reminder: {json.dumps(ti)[:50]}", code == 0 and out is None)


def test_teammate_idle_redispatches_until_budget_ceiling() -> None:
    root = project()
    out, code, err = run_hook(IDLE, {"teammate_name": "hermes"}, root)
    check("idle with nothing briefed → rest", code == 0)
    write(root, ".starlight/queen/briefs/task-1.json", brief())
    out, code, err = run_hook(IDLE, {"teammate_name": "hermes"}, root)
    check("idle with uncredited brief → back to work (exit 2)", code == 2 and "task-1" in err, err)
    write(root, ".starlight/queen/active.json", {"budget": {"microUsd": 100}, "spentMicroUsd": 100})
    out, code, err = run_hook(IDLE, {"teammate_name": "hermes"}, root)
    notes = [f for f in os.listdir(os.path.join(root, ".starlight/queen/receipts")) if f.startswith("stand-down-")]
    check("budget ceiling → rest with a stand-down note", code == 0 and len(notes) == 1)
    root2 = credited_project()
    out, code, err = run_hook(IDLE, {"teammate_name": "hermes"}, root2)
    check("everything credited → rest", code == 0)


def test_stop_blocks_once_then_never_for_the_same_open_set() -> None:
    root = project()
    S1 = sid("stop1")
    write(root, ".starlight/queen/briefs/task-1.json", brief())
    first, _, _ = run_hook(STOP, {"session_id": S1}, root)
    check("stop blocks with uncredited brief", first is not None and first.get("decision") == "block" and "task-1" in first.get("reason", ""))
    second, _, _ = run_hook(STOP, {"session_id": S1}, root)
    check("stop never blocks twice for the same set", second is None)
    third, _, _ = run_hook(STOP, {"session_id": S1, "stop_hook_active": True}, root)
    check("stop_hook_active is honoured", third is None)
    write(root, ".starlight/queen/briefs/task-2.json", brief(id="task-2"))
    fourth, _, _ = run_hook(STOP, {"session_id": S1}, root)
    check("a new open brief re-arms the stop", fourth is not None and fourth.get("decision") == "block")
    out, _, _ = run_hook(STOP, {"session_id": sid("stop2")}, root, env={"QUEEN_OPS_NO_STOP": "1"})
    check("QUEEN_OPS_NO_STOP opts out", out is None)
    root2 = credited_project()
    out, _, _ = run_hook(STOP, {"session_id": sid("stop3")}, root2)
    check("stop allows when everything is credited", out is None)


def test_settings_snippet_names_every_hook_once() -> None:
    snippet = json.load(open(os.path.join(PACK, "settings.snippet.json"), encoding="utf-8"))["hooks"]
    named = [re.search(r"queen-ops-[a-z-]+\.py", h["command"]).group(0) for entries in snippet.values() for e in entries for h in e["hooks"]]
    shipped = sorted(f for f in os.listdir(HOOKS) if f.startswith("queen-ops-") and f.endswith(".py"))
    check("every shipped hook is wired exactly once", sorted(named) == shipped, f"{sorted(named)} vs {shipped}")
    check("events are the six the skill documents", sorted(snippet) == sorted(["SessionStart", "PreToolUse", "TaskCreated", "TaskCompleted", "TeammateIdle", "Stop"]))
    for entries in snippet.values():
        for e in entries:
            for h in e["hooks"]:
                check(f"timeout in seconds: {h['command'][-28:]}", isinstance(h["timeout"], int) and h["timeout"] <= 60)


def test_install_dry_run_writes_nothing() -> None:
    root = project(armed=False)
    p = subprocess.run(["bash", os.path.join(PACK, "install.sh"), root, "--dry-run"], capture_output=True, text=True)
    check("install --dry-run exits 0", p.returncode == 0, p.stderr)
    check("install --dry-run writes no .claude", not os.path.exists(os.path.join(root, ".claude")))
    p = subprocess.run(["bash", os.path.join(PACK, "install.sh"), root], capture_output=True, text=True)
    check("install exits 0", p.returncode == 0, p.stderr)
    settings = json.load(open(os.path.join(root, ".claude", "settings.json")))
    check("install merged six events", sorted(settings["hooks"]) == sorted(["SessionStart", "PreToolUse", "TaskCreated", "TaskCompleted", "TeammateIdle", "Stop"]))
    p = subprocess.run(["bash", os.path.join(PACK, "install.sh"), root], capture_output=True, text=True)
    settings2 = json.load(open(os.path.join(root, ".claude", "settings.json")))
    check("re-install is idempotent", settings == settings2)
    gi = open(os.path.join(root, ".gitignore")).read()
    check(".starlight/queen/ is gitignored", ".starlight/queen/" in gi)
    shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        print(f"\n{t.__name__}")
        try:
            t()
        except Exception as exc:  # noqa: BLE001
            print(f"  FAIL {t.__name__} raised {exc!r}")
            failures.append(t.__name__)
    print(f"\n{len(failures)} failure(s)" if failures else "\nall queen-ops hook tests passed")
    sys.exit(1 if failures else 0)
