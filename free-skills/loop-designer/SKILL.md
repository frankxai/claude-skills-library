---
name: loop-designer
description: Compile a goal into a durable, file-backed agent loop — a .loop/<name>/ charter any coding agent (Claude Code, Codex, Gemini, Grok) can execute unattended. Use when the user wants to "build a loop", "design a loop", "run X continuously/24-7", "make an agent keep working on Y", automate recurring work, or convert a big backlog into autonomous iteration. Produces LOOP.md + state.json + backlog.md, ready for loop-runner.
---

# Loop Designer

You are compiling a **loop**, not writing a prompt. A prompt asks an agent to do something once; a loop is a durable program — goal, state, iteration discipline, verification, and exit conditions — stored in files so that *any* agent can pick it up cold, run exactly one iteration, and leave it resumable. The agent is the interpreter; the loop is the program. Design accordingly: everything that matters must survive a context wipe.

## When to use this

Use when converting a goal into an unattended or semi-attended iteration system: draining a backlog, keeping CI green, optimizing a metric, watching a system, producing content on cadence. Do NOT design a loop for one-shot tasks (just do them) or for work with no checkable outcome (loops without verification diverge into slop — fix the verifiability problem first).

## The compilation pipeline

Work through these six steps in order. Steps 1–3 are thinking; 4–6 emit files.

### 1. Extract the invariant goal

Interview the user (or the task description) until you can state:

- **Goal** — one sentence, outcome-shaped, stable across weeks ("all 40 hub pages pass the a11y audit", not "work on a11y").
- **Done-when** — a *mechanically checkable* predicate. If you cannot express done-when as a command, script, or countable file state, the loop is not designable yet; push back and narrow the goal.
- **Never-do** — the guardrail list (no deploys, no sends, no deletes, no spend, no force-push…). Inherit the repo's hard stops; add loop-specific ones.

### 2. Pick the archetype

Match against the taxonomy in `references/archetypes.md` (read it now). Summary:

| Archetype | Core mechanic | Terminates? |
|---|---|---|
| **backlog-drain** | pick top item → do → verify → strike through | yes — backlog empty |
| **ratchet-climb** | move one metric monotonically; revert regressions | yes — target reached |
| **red-green** | write failing test → make it pass → refactor | yes — spec covered |
| **watch-and-report** | read-only scan → diff vs last state → report | no — runs on cadence |
| **evaluate-optimize** | generate → judge against rubric → keep best → retry | yes — rubric satisfied |
| **babysitter** | poll external state (CI/PR) → kick until terminal | yes — merged/green |
| **pipeline** | stage N's output is stage N+1's input, each gated | yes — final gate passes |

Hybrids are normal (a backlog-drain whose verify step is a ratchet). Name the primary archetype in the charter — it tells the runner which discipline applies.

### 3. Size the iteration

The single highest-leverage design decision. One iteration = one fresh-context agent session that must **complete its unit and verify it** with room to spare. Too big → the agent runs out of context mid-unit and leaves debris; too small → overhead dominates. Heuristics:

- One backlog item, one test, one page, one file-family per iteration.
- If a unit needs >~15 tool calls to verify, split it in the backlog, not in the iteration.
- The iteration must end with the working tree **clean or committed** — never leave uncommitted mid-work for the next iteration to misinterpret.

### 4. Emit the charter

Create `.loop/<name>/LOOP.md` from `references/loop-charter-template.md` (read it, don't improvise the format — the runner and orchestrator parse these sections). The charter's load-bearing sections: Goal, Done-when, Archetype, Iteration contract, Verification (exact commands), Ratchet (metric + direction + regression policy), Guardrails, Escalation (stall definition + who to ping + how), Budget (max iterations / tokens / wall-clock).

### 5. Emit the state files

- `state.json` — from the schema in `references/state-schema.md`: `{name, archetype, status: "designed", iteration: 0, ratchet: {...}, promotion: {mode: "propose-only", clean_cycles: 0, required_cycles: 3}, budget, last_run: null}`.
- `backlog.md` — prioritized checklist of units, each sized per step 3. For non-backlog archetypes, this holds the watch-list or rubric instead.
- `journal.md` — created empty with just the header row; the runner appends.

### 6. Run the doctor and hand off

Run the checks in `references/loop-doctor.md` against what you just wrote (done-when checkable? verification commands actually runnable here? units sized? guardrails inherited?). Fix failures before handoff. Then tell the user exactly how to start it, e.g.:

- Claude Code: `/loop 30m run one iteration of .loop/<name> per the loop-runner skill`
- Codex / any CLI: `while :; do codex exec "run one iteration of .loop/<name> per the loop-runner skill"; sleep 1800; done`
- Cloud cron: schedule the same one-iteration instruction.

## Design rules (the ones that decide convergence)

1. **State in files, never in conversation.** Every iteration starts from a fresh context reading LOOP.md + state.json + journal tail. If a fact matters, it's in a file.
2. **Verification inside the iteration, not after the loop.** pick → do → **verify** → record. An unverified unit is not done and must not be struck through.
3. **The ratchet only moves one way.** Define the metric so regressions are detectable and the policy is automatic: revert, don't debug forward.
4. **New loops are propose-only.** Write access (commits to main, publishes, sends) is *earned* via the promotion gate — N clean verified cycles, human-reviewed. Design the read-only form first.
5. **Stall is a first-class outcome.** K iterations without ratchet movement (default 3) → status `stalled`, escalate per charter. A loop that spins without progress is worse than a stopped loop.
6. **Budgets are hard.** Max iterations, max wall-clock, max spend — enforced by the runner, declared by you.
7. **Smaller charter beats smarter charter.** The agent reading LOOP.md is already smart; encode *constraints and checks*, not lectures.

## References

- `references/archetypes.md` — full taxonomy with worked examples and failure modes.
- `references/loop-charter-template.md` — the LOOP.md template (parse-stable section names).
- `references/state-schema.md` — state.json schema + journal.md format.
- `references/loop-doctor.md` — pre-flight checklist the designer runs before handoff.
- `references/loop-native-skills.md` — how skills and loops compose; guidance for skill-creator/plugin-creator authors.
