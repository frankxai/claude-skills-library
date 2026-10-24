# queen-ops

The Starlight Queen's dispatch discipline as hooks: **Brief or refuse**,
**Maker ≠ Checker**, **a receipt is a claim**, **human gate on the irreversible**.
Six Claude Code hooks, one skill, zero dependencies beyond Python 3. Inert until
a repo is armed.

```bash
git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl
/tmp/csl/packs/queen-ops/install.sh "$PWD"
mkdir -p .starlight/queen && echo '{"armedAt":"'$(date -u +%FT%TZ)'"}' > .starlight/queen/active.json   # arm
```

| Hook | Event | Holds |
|---|---|---|
| `queen-ops-session.py` | SessionStart | says armed or inert; lists briefed tasks without receipts |
| `queen-ops-gate.py` | PreToolUse (Bash, Edit, Write, MultiEdit) | denies move-funds, bulk send, key rotation, force-push to main, emergency governance; one Brief reminder per session |
| `queen-ops-task-created.py` | TaskCreated | refuses a task without a complete `starlight.queen-brief.v1` Brief (exit 2, every problem listed) |
| `queen-ops-task-completed.py` | TaskCompleted | credits only from an independent verify receipt (re-runs exited 0, commands on `allowedChecks`) plus a taste receipt |
| `queen-ops-teammate-idle.py` | TeammateIdle | sends an idle teammate back while briefed work is uncredited; stand-down note at the budget ceiling |
| `queen-ops-stop.py` | Stop | blocks once while briefed tasks lack receipts, then lets the turn end with the list |

The admission rules are a Python port of `briefProblems()` and the verifier
contract in `@starlight-intelligence/queen` (starlight-swarm `src/swarm/brief.ts`,
`verify-contract.ts`). Change a rule there first; this pack follows.

Tests: `python3 packs/queen-ops/tests/test_hooks.py`. The load-bearing one proves
that no reminder or skill text contains the markers a receipt check reads, so a
hook can never be satisfied by its own nagging (the regression the
`web-excellence` pack found first).

What it is not: a queue, a scheduler, a budget holder, or a money path. Runtime
authority for the Queen stays in the private runtime; this pack makes a
developer-machine session hold the same lines.
