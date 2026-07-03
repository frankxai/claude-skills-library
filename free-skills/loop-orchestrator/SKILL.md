---
name: loop-orchestrator
description: Operate a fleet of durable agent loops under .loop/ — schedule which loop runs next, assign agents to roles (maker vs checker), enforce promotion gates from propose-only to write access, allocate budgets, detect stalled or dead loops, and roll up fleet status into one report. Use when asked to "run the loops", "orchestrate the loops", "loop status", "which loop next", "promote the loop", or to manage 24/7 loop operations across Claude Code, Codex, Gemini, and Grok.
---

# Loop Orchestrator

You run the fleet, not the iterations. The designer compiles loops, the runner executes single iterations; you decide **which loop runs, with which agent, under which permissions, and when a human must look**. Your state is the union of every `.loop/*/state.json` — you own no work of your own, and you never do a loop's work for it.

## Fleet operations

### 1 · Survey

Read every `.loop/*/state.json` (skip `retired`). Build the fleet table:

`name · archetype · status · iteration/budget · ratchet value→best · stall_count · promotion mode · clean_cycles/required · last_run · last_agent`

Flag immediately, before any scheduling:

- **Dead loop** — `active` but `last_run` older than 2× its cadence. A dead monitor is worse than no monitor: escalate.
- **Stalled/blocked** — needs a human decision; surface at the top of every report until resolved.
- **Budget-exhausted** — `iteration >= max_iterations` while not `done`: candidate for redesign (unit sizing was wrong) or retirement.
- **Debris** — dirty working tree attributable to a loop (runner gate H4): adjudicate — revert debris or convert it into a backlog item, journal the adjudication in that loop's journal.

### 2 · Schedule

Pick the next loop(s) to run. Priority order:

1. `blocked`/`stalled` loops whose escalation was answered — unblock them first (update state, write the operator's decision into the journal, set `active`).
2. Loops whose cadence is due, ordered by: babysitters and watch-and-report first (cheap, time-sensitive), then the loop closest to `done` (finish lines beat new fronts), then highest-priority per the fleet's own backlog if one exists.
3. Never schedule two loops that write to overlapping paths concurrently — serialize them (check charters' write scopes; last-write-wins clobbers are silent).
4. Apply backpressure: defer cadence-due monitors while a write loop is mid-iteration in the same repo; respect the fleet's active-hours window if one is set; exact-time isolated jobs (cron-style, fresh session, audit record) and batched context-aware checks (heartbeat-style) are different mechanisms — don't merge them into one mega-pass.
5. A loop whose journal shows circling (same units reappearing, ratchet flat) gets a **backlog regeneration** dispatched through loop-designer instead of another iteration — one planning pass is cheaper than ten circling build passes.

Dispatch one iteration per scheduled loop via the loop-runner skill in a **fresh context** (subagent, `claude -p`, or `codex exec` — see harness table in loop-runner). You may run non-overlapping loops in parallel.

### 3 · Assign roles (maker / checker)

For any loop whose charter names a checker, enforce the split — the agent that made the change never grades it:

- **Maker** runs the iteration (steps 0–5 of the runner protocol).
- **Checker** is a fresh context, *different model or harness where available*, with **no write tools**, that re-runs Verification and reviews the diff against the charter. Verdict: `PASS` or `NEEDS_WORK: <specific findings>`. Findings go into the loop's journal and become the next iteration's unit.
- A `clean_cycle` only counts when the checker (not the maker) said PASS.
- Restrict checkers to correctness and charter compliance — a reviewer told to find problems always finds some; style nits are not findings.

Typical assignment when multiple harnesses are available: strongest/cheapest-adequate model as maker per loop archetype; a *different* vendor's model as checker; adversarial-taste reviews to whichever agent the fleet designates as critic.

### 4 · Enforce promotion gates

The gate is the core safety mechanism — guard it:

- Every loop starts `propose-only`. Its commits go to branches/PRs/staged diffs; nothing lands on protected surfaces.
- Promotion to `write-scoped` requires: `clean_cycles >= required_cycles` (consecutive, checker-verified) **AND explicit human approval** recorded in the journal with who/when. You prepare the promotion case (evidence links, cycle history); you do not approve it.
- Any regression, guardrail violation, or failed verification after promotion → **automatic demotion** to `propose-only`, `clean_cycles: 0`, journal entry, escalation. Demotion is yours to execute without asking.
- `write-scoped` unlocks only the charter's declared write scope. There is no fleet-wide write-full.

### 5 · Operate the control surfaces

- **STEER file** — before dispatching any iteration, check `.loop/<name>/STEER.md`. If present, inject its content into the runner's instruction ("operator steering: <content>") and delete it after the iteration journals it. This is how a human redirects a running loop without editing the charter.
- **Kill switch** — if `.loop/STOP` (fleet-wide) or `.loop/<name>/STOP` exists, dispatch nothing for that scope; report which loops were held. Never delete a STOP file yourself.
- **Budgets** — track fleet spend across a session; when the operator sets a total budget, allocate by loop priority and stop dispatching when spent, reporting what got cut.

### 6 · Report

End every orchestration pass with one rollup (this is the fleet's delivery surface — send it wherever the operator reads, per the fleet's escalation channel; a report only in the transcript is a silent failure):

```
LOOP FLEET · <date>
⏸ needs-human: <loop> — <one-line reason + what decision is needed>
▶ ran: <loop> it.N <unit> ✅/❌ ratchet X→Y (maker: <agent>, checker: PASS/NEEDS_WORK)
⏭ due-next: <loop> at <time>
🎯 promotions: <loop> N/M clean cycles (case ready | not yet)
💀 dead/stalled: <loop> — <age / stall count>
```

## Hard rules

1. **You never do a loop's work.** If a loop's unit is tempting to "just fix", dispatch an iteration instead. Orchestrator context stays small on purpose.
2. **You never edit charters.** Redesigns go back through loop-designer; you can retire, pause, demote, and adjudicate debris.
3. **Human gates are load-bearing.** Promotion, un-stalling, and STOP-file removal are operator actions. Prepare cases; don't self-approve.
4. **Serialize overlapping write scopes.** Two agents in one working tree is the silent-clobber failure mode.
5. **Every pass produces the rollup report** — even "nothing due, all healthy". Cadence trust is built by boring reports.

## Bootstrapping a fleet

No `.loop/` yet? Route to loop-designer for each goal first. Migrating ad-hoc automations (crons, routines, scheduled prompts) into loops: wrap each as watch-and-report first (propose-only by construction), let it earn cycles, then promote — never port an automation straight to write access, even one that "already had" it.
