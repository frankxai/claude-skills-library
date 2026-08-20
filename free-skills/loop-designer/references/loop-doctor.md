# Loop doctor — pre-flight and health checks

Run these checks (a) at design time before handing a loop to the user, and (b) any
time a loop misbehaves. Each check is pass/fail with a specific fix. A loop that
fails any REQUIRED check must not be started.

## REQUIRED — design validity

| # | Check | How | Fix on fail |
|---|---|---|---|
| D1 | Charter parses | `.loop/<name>/LOOP.md` exists with every template section present, exact headings | re-emit from template |
| D2 | Done-when is mechanical | done-when names command(s)/countable state, no judgment words ("good", "clean", "polished") | narrow the goal with the user |
| D3 | Verification runs | execute each Verification command once, here, now | fix command or environment; never hand off untested |
| D4 | Ratchet readable | the "Read via" command returns the metric | fix command |
| D5 | Units sized | spot-check 3 backlog items: each completable + verifiable in one fresh-context session | split oversized items in backlog.md |
| D6 | Guardrails inherited | charter Guardrails include the repo's hard-stops (check CLAUDE.md / AGENTS.md) | copy them in explicitly |
| D7 | Escalation reaches a human | Escalation names a real channel (Slack/PR/inbox), not just the journal | wire a channel |
| D8 | Propose-only start | `.loop/<name>/state.json` `promotion.mode` is `propose-only` for any loop that could write/publish/send | reset mode |
| D9 | Budget declared | `budget.max_iterations`, `budget.max_minutes_per_iteration`, `budget.cadence` all set | set them |

## HEALTH — runtime (run when a loop looks sick)

| # | Check | Symptom it catches |
|---|---|---|
| H1 | journal entry per iteration (`iteration` in `.loop/<name>/state.json` == entry count) | silent iterations — work happening off the books |
| H2 | `ratchet.value` moved within last `ratchet.stall_threshold` iterations | spinning without progress |
| H3 | No ❌ verify in last 3 entries without a matching revert/escalation flag | failures being absorbed instead of handled |
| H4 | Working tree clean between iterations | debris — a prior iteration died mid-unit |
| H5 | `promotion.clean_cycles` math consistent with journal flags | promotion gate being gamed by sloppy bookkeeping |
| H6 | Iterations within wall-clock budget (journal timestamps) | units too big — return to D5 |
| H7 | Same unit not picked >2 iterations in a row without a Flags note | thrash on one item; force-skip and escalate it |
| H8 | Every ❌ journal entry with an identifiable cause has a matching sign in `.loop/<name>/signs.md` | failures not being converted into immunity — the loop will repeat them |
| H9 | `.loop/<name>/signs.md` under ~40 lines and free of speculative entries | sign bloat polluting every iteration's context |

## Verdict format

Report as: `Loop doctor: PASS` or `Loop doctor: FAIL — D3, D7` plus one line per
failure with the fix. Health runs report `HEALTH: OK` or the failing H-checks the
same way.
