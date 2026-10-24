---
name: queen-ops
description: Run a Starlight Queen session on a developer machine - Brief or refuse, Maker ≠ Checker, a receipt is a claim, one receipt per dispatch. Use when dispatching work to subagents or an agent team, when a task is about to be created or completed, or when a repo has .starlight/queen/active.json. The hooks in this pack enforce the file shapes described here; the skill explains them.
---

# queen-ops — the Queen's dispatch discipline, enforced

The Starlight Queen decides, verifies and records. She does not do the swarm's
work herself, and she never takes a worker's word for it. This skill is the
developer-machine half of that: six hooks that turn four rules into gates, and
the file shapes those gates read.

The kernel the rules come from is `@starlight-intelligence/queen`
(starlight-swarm `src/swarm/`): `briefProblems()`, `verifyClaim()`,
`issueDispatchReceipt()`. The hooks carry a Python port of the admission rules
so a repo needs nothing installed beyond Python 3.

## Armed or inert

The hooks do nothing until the repo is **armed**: `.starlight/queen/active.json`
exists under the project directory. Arm a session when every task in it is a
dispatch and you want the gates. Installing the pack is not arming it.

```bash
mkdir -p .starlight/queen && echo '{"armedAt":"2026-10-19T00:00:00Z","budget":{"microUsd":5000000}}' > .starlight/queen/active.json
```

`.starlight/queen/` is gitignored by the installer: briefs and receipts are
local evidence, not repository artifacts. The signed ledger belongs elsewhere.

## The four rules and the gate that holds each

| Rule | Gate | What it reads |
|---|---|---|
| **Brief or refuse** | `TaskCreated` → exit 2 | `.starlight/queen/briefs/<task_id>.json`, or a ```json block in the task description with `"schema": "starlight.queen-brief.v1"` (written to that path on acceptance) |
| **Maker ≠ Checker** | `TaskCreated`, `TaskCompleted` | `maker.id ≠ verifier.id`, and `maker.model ≠ verifier.model` when both are set; the verify receipt's `verifier` must be that independent actor |
| **A receipt is a claim** | `TaskCompleted` → exit 2 | `receipts/<task_id>.verify.json` (`credited: true`, `reruns[]` all `exitCode 0`, commands on the Brief's `allowedChecks`) and `receipts/<task_id>.taste.json` (`verdict` pass/ship, `pack`, `reviewer`) |
| **Human gate on the irreversible** | `PreToolUse` → deny | moving funds, bulk send, key rotation, force-push to main, switching governance to emergency |

Two more keep the swarm honest about time: `TeammateIdle` sends an idle
teammate back while briefed tasks lack receipts (and writes a stand-down note
instead when `active.json` shows the budget ceiling reached), and `Stop` blocks
the turn once while briefed tasks are uncredited, then lets it end with the list
in the transcript.

## File shapes

**Brief** (`briefs/<task_id>.json`), the unit of dispatch:

```json
{
  "schema": "starlight.queen-brief.v1",
  "id": "task-12",
  "objective": "Survey the three model routers in this repo and name the one to keep.",
  "acceptance": ["Every router is named by file path.", "The recommendation cites one measured number."],
  "output": { "format": "markdown", "maxBytes": 20000 },
  "tools": ["Read", "Grep"],
  "boundaries": ["No edits outside docs/.", "No network."],
  "budget": { "microUsd": 2000000, "wallTimeMs": 600000 },
  "maker": { "id": "teammate:hermes", "model": "gemini-2.5-flash" },
  "verifier": { "id": "teammate:sentinel", "model": "claude-opus-4-6" },
  "allowedChecks": ["npm test"],
  "general": "starlight-hermes"
}
```

Every field above is required except `general`. `allowedChecks` are exact
command strings: no globs, no `;|&`. An empty list is allowed and means the
verifier can credit nothing by re-run, so such a task cannot complete.

**Verify receipt** (`receipts/<task_id>.verify.json`), written by the verifier
named in the Brief after it re-ran the checks itself. The angle-bracket fields
are placeholders on purpose: copied as-is, this example credits nothing.

```json
{ "briefId": "task-12", "credited": true,
  "reruns": [{ "command": "<exact string from the Brief's allowedChecks>", "exitCode": 0, "durationMs": 41000 }],
  "verifier": { "id": "<the Brief's verifier.id>", "model": "<the Brief's verifier.model>" },
  "evidence": [{ "ref": "docs/routers.md", "sha256": "<sha256 of the artifact>" }], "at": "2026-10-19T12:00:00Z" }
```

**Taste receipt** (`receipts/<task_id>.taste.json`), written by whoever ran the
repo's taste contract (design.md / taste.md, or `web-release-gate` for UI):

```json
{ "briefId": "task-12", "verdict": "<pass|ship>", "pack": "taste.md",
  "reviewer": { "id": "<reviewer id, not the maker>" }, "notes": "Sentence case held; no filler." }
```

## How a Queen session runs

1. Arm the repo. Write the Briefs before creating tasks; one Brief per task id.
2. Create tasks (agent team or subagents). The `TaskCreated` gate refuses any
   task without a complete Brief and lists what is missing.
3. Makers work inside their tool allowlist and boundaries. The `PreToolUse`
   gate denies the human-gated actions whatever the permission mode says.
4. The **verifier**, never the maker, re-runs the Brief's checks and writes the
   verify receipt. The taste reviewer writes the taste receipt.
5. Complete the task. The `TaskCompleted` gate credits it only from those two
   files, issued by the right actors.
6. When all briefed tasks are credited, the turn may end. If the budget is
   spent first, stand down: the idle hook writes the note; the Queen reports
   what was credited and what was not.

Optional, when `@starlight-intelligence/queen` is installed: `starlight-queen
brief check <file>` validates a Brief with the same rules; `starlight-queen
receipt verify ledger.jsonl --key public.pem` verifies signed dispatch receipts.

## What this pack does not do

It holds no budget, runs no queue or scheduler, moves no money and sends
nothing. It cannot make an unverified task count as done, and nothing an agent
writes into the transcript satisfies a gate: the gates read files, and the
files have to say what only a real verifier run would say.

Escape hatches, deliberate and visible: `QUEEN_OPS_NO_STOP=1` (Stop never
blocks), `QUEEN_OPS_EVERY_EDIT=1` (reminder on every edit), and removing
`active.json` (disarm). None of them makes a task credited.

## Provenance

Rules from the Starlight Queen kernel (starlight-swarm, MIT) and the private
Queen runtime's verifier contract (`queen-verify.js`: "a worker receipt is a
claim; credit comes only from checks this process re-runs"). Governance modes
absorbed from the retired hive-mind queen-coordinator definition; coup
prevention, triple vote and BFT dropped. Hook mechanics follow the
`web-excellence` pack in this library.
