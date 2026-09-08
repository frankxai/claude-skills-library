# routine-contract

Makes it impossible for a scheduled agent to report success while producing
nothing.

## Why

An audit of a production fleet on 2026-09-06 found **all seven scheduled
routines reporting `SUCCEEDED` while committing nothing** — for weeks. Not
degraded: zero durable output. The receipts directory one routine claimed to
write had never existed. Another had fired every Friday since a repair and
produced no file. No routine had ever pushed a commit. Run durations were the
tell: 76 seconds for a three-domain research scan, 65 for a thirteen-model
benchmark.

Two structural faults:

1. **The work sat behind an orchestration tool that requires explicit user
   opt-in** (in Claude Code, `Workflow`). A cron prompt is not a user asking, so
   the call was declined, the agent wrote a reasonable-looking summary, and the
   turn ended cleanly.
2. **The prompts ended in "report your findings"** — into a run-history page
   discarded with the container.

Nothing asserted the output existed, so status tracked narration rather than
work. `SUCCEEDED` means the turn ended without throwing. It has never meant the
job was done.

## What's in it

| Piece | What it does |
|---|---|
| `skills/routine-contract/SKILL.md` | The contract: preflight, no opt-in-gated orchestration, the three-bullet digest, what each status means. |
| `scripts/routine-digest.mjs` | The primitive. `preflight` proves the sink is reachable before tokens are spent; `emit` writes three bullets to a monthly digest + JSONL ledger, commits, pushes, and **exits non-zero if it could not**. |
| `ci/routine-drift-check.mjs` | The fleet-level detector. Compares each routine's newest ledger entry against its cadence window — catches a routine that stopped reporting, which no single run can detect. |
| `ci/routine-contract.yml` | Runs the selftest and the drift check daily and on PRs that touch either. |
| `contract.snippet.md` | The block to paste into `CLAUDE.md` / `AGENTS.md`. |
| `tests/test_routine_contract.mjs` | 12 tests, no dependencies. |

Everything here is native to this pack — nothing is vendored, so there is no
`SOURCES.md`.

## Install

```bash
git clone --depth 1 https://github.com/frankxai/claude-skills-library /tmp/csl \
  && /tmp/csl/packs/routine-contract/install.sh "$PWD"
```

`--dry-run` to preview, `--skills-only` for the skill alone, `--no-ci` to skip
the workflow. Idempotent: re-running upgrades the skill, script and check, and
never overwrites `routines.config.json`.

Then do the two things the installer cannot:

1. **Paste `contract.snippet.md` into `CLAUDE.md` and `AGENTS.md`.** This is the
   half a skill file cannot cover. A routine's own prompt is often owned by a
   human or another system and cannot be edited by an agent — on Claude Code,
   `update_trigger` refuses on routines it did not create. A repo-side contract
   reaches every routine that checks the repo out, without touching a trigger.
2. **List your routines in `routines.config.json`**, or the drift check has
   nothing to check.

```json
{
  "routines": [
    { "name": "research-pulse-daily", "maxAgeHours": 30 },
    { "name": "newsletter-friday", "maxAgeHours": 192, "startsAfter": "2026-09-15" }
  ]
}
```

`maxAgeHours` is the cadence plus a grace margin. `startsAfter` suppresses a
routine until the contract is live for it, so adoption doesn't open with a wall
of red.

## The design in one line

**A routine that cannot persist its output exits non-zero**, so a void loop goes
red instead of green-and-empty. Everything else follows from that.

Three properties worth keeping if you fork this:

- **Preflight runs before the work**, not after. Work that cannot be persisted
  is work thrown away; spending tokens first makes the loss larger.
- **Vacuous bullets are rejected.** "done", "n/a", "no changes" — a content-free
  digest is the same void loop wearing a hat.
- **The drift check exits 2, not 0, when it cannot run.** A check that has gone
  blind must not read as success. That distinction is itself tested.

## Verify

```bash
node packs/routine-contract/tests/test_routine_contract.mjs   # 12 tests
node scripts/ops/routine-digest.mjs selftest                  # after install
```

The load-bearing test is `emit fails when it cannot persist`. The whole pack
rests on that one property; if it ever regresses, every routine silently returns
to reporting green while producing nothing — with a passing suite. That test is
why it cannot come back.
