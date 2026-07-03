# state.json schema + journal.md format

## state.json

Machine-readable loop state. The runner updates it at the end of every iteration;
the orchestrator reads it to schedule. Keep it small — it is a dashboard row, not a
database.

```json
{
  "name": "hub-a11y-drain",
  "archetype": "backlog-drain",
  "status": "designed",
  "iteration": 0,
  "ratchet": {
    "metric": "unchecked backlog items",
    "direction": "decreasing",
    "value": 40,
    "best": 40,
    "stall_count": 0,
    "stall_threshold": 3
  },
  "promotion": {
    "mode": "propose-only",
    "clean_cycles": 0,
    "required_cycles": 3,
    "write_scope": []
  },
  "budget": {
    "max_iterations": 60,
    "max_minutes_per_iteration": 20,
    "cadence": "every 30m"
  },
  "last_run": null,
  "last_agent": null,
  "created": "<ISO date>",
  "notes": ""
}
```

### status values

| status | meaning | set by |
|---|---|---|
| `designed` | charter written, never run | designer |
| `active` | eligible for iterations | operator or orchestrator |
| `paused` | intentionally not running | operator |
| `stalled` | stall_threshold hit — needs human | runner |
| `blocked` | waiting on an escalated decision | runner |
| `done` | done-when predicate satisfied | runner |
| `retired` | superseded / abandoned, kept for the journal | operator |

### Field rules

- `ratchet.value` is written every iteration from the charter's "Read via" command —
  never estimated. `best` tracks the high-water mark; `value` worse than `best` for a
  completed iteration means a regression happened and was not reverted → the runner
  must treat that as a failed iteration.
- `promotion.clean_cycles` resets to 0 on any regression, guardrail violation, or
  failed verification. It only counts *consecutive* clean cycles.
- `last_agent` records which harness ran the iteration (`claude-code`, `codex`,
  `gemini`, `grok`, …) — useful when loops behave differently per agent.

## journal.md

Append-only, newest entry last. One entry per iteration, written at the END of the
iteration (an iteration with no journal entry did not happen). Format:

```markdown
## <iteration N> · <ISO timestamp> · <agent>
- Unit: <what was picked>
- Did: <1-3 lines, concrete — files touched, commands run>
- Verify: <command → actual result>  ✅ | ❌
- Ratchet: <old> → <new>
- Next: <what the next iteration should pick, or "top of backlog">
- Flags: <regression reverted / guardrail near-miss / escalated / none>
```

Rules:

- **Max ~10 lines per entry.** The next iteration reads only the last 3 entries; a
  journal that rambles starves the work of context.
- **Evidence over narrative.** "Verify: `pnpm test` → 214 passed" beats "tests look
  good".
- Never rewrite or delete old entries — the journal is the loop's memory and audit
  trail. Corrections are new entries.
