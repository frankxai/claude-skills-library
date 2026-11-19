# LOOP.md charter template

Copy this into `.loop/<name>/LOOP.md` and fill every section. Section headings are
parse-stable: loop-runner and loop-orchestrator locate them by exact name — do not
rename or reorder them. Keep the whole charter under ~120 lines; it is re-read at the
top of every iteration and competes with the actual work for context.

```markdown
# Loop: <name>

## Goal
<One sentence, outcome-shaped, stable across weeks.>

## Done-when
<Mechanically checkable predicate. Command(s) + expected result, or countable file
state. Example: `python3 scripts/validate_skills.py` exits 0 AND backlog.md has no
unchecked items.>

## Archetype
<backlog-drain | ratchet-climb | red-green | watch-and-report | evaluate-optimize |
babysitter | pipeline> — <one line on the hybrid, if any>

## Iteration contract
- Unit: <what exactly one iteration completes — one backlog item / one test / one page>
- Start: read state.json, journal.md (last 3 entries), backlog.md; pick the top
  eligible unit.
- End: unit verified + recorded, working tree clean or committed, state.json updated.
- Never: start a second unit, leave uncommitted mid-work, mark unverified work done.

## Verification
<Exact commands with expected outcomes. These run INSIDE every iteration.>
- `<command>` → <expected>
- `<command>` → <expected>

## Ratchet
- Metric: <e.g. unchecked backlog items | failing tests | audit score>
- Direction: <decreasing | increasing>
- Read via: `<command or file>`
- On regression: revert the iteration's changes, journal the regression, do not retry
  the same approach.

## Guardrails
<Inherited repo hard-stops plus loop-specific never-dos. Explicit verbs: no deploy,
no publish, no send, no delete outside <path>, no spend, no force-push, no touching
<protected paths>.>

## Escalation
- Stalled: <K> iterations without ratchet movement (default 3) → set status
  "stalled", write journal entry with the blocker, <how to notify the operator:
  Slack DM / PR comment / file in inbox/>.
- Blocked on a decision: never guess on <list decision classes> — stop and escalate.

## Budget
- Max iterations: <N>
- Max wall-clock per iteration: <minutes>
- Cadence: <how often iterations fire — on-demand / every 30m / daily HH:MM>

## Promotion
- Current mode: propose-only  <!-- propose-only | write-scoped | write-full -->
- Write access requires: <N=3> consecutive clean cycles (verified, no regressions,
  no guardrail violations) reviewed by <who>.
- Write scope when promoted: <exact paths / actions unlocked>.
```

## Filling notes

- **Done-when vs Ratchet**: done-when is binary and final; the ratchet is the progress
  scalar. Every charter needs both — done-when alone can't detect stall, ratchet
  alone can't terminate.
- **Verification commands must run in the loop's own repo/environment.** The designer
  runs each one once at design time (loop-doctor step) — a charter with untested
  verification is invalid.
- **Escalation must name a channel that reaches a human**, not "report in the log".
  Logs are where escalations go to die.
