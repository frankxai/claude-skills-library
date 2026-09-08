---
name: routine-contract
description: The operating contract for any scheduled or unattended agent session — a cron job, a Routine, a CI-triggered agent, a nightly sweep. Use when writing, reviewing, debugging or scheduling automation that runs without a human present, and whenever a scheduled job reports success but you cannot find what it produced. Defines preflight, why unattended sessions must not call orchestration tools that require user opt-in, the three-bullet digest that makes output durable, and why a run that persists nothing must exit non-zero rather than report green.
---

# Routine contract

An unattended agent session fails differently from an interactive one. Nobody
reads its transcript, so a plausible-sounding report is indistinguishable from
work. This is the contract that closes that gap.

## The failure this prevents

On 2026-09-06 an audit of a production fleet found **all seven scheduled
routines reporting `SUCCEEDED` while committing nothing** — for weeks. Not
degraded: zero durable output. The receipts directory one routine claimed to
write had never existed. Another had fired every Friday since a repair and
produced no file. No routine had ever pushed a commit.

Two faults, both structural:

1. **The work sat behind an orchestration tool that requires explicit user
   opt-in.** A cron prompt is not a user asking, so the call was declined, the
   agent wrote a reasonable-looking summary, and the turn ended cleanly.
2. **The prompts ended in "report your findings"** — into a run-history page
   that is discarded with the container.

Nothing ever asserted the output existed, so status tracked narration rather
than work. **`SUCCEEDED` means the turn ended without throwing.** It has never
meant the job was done.

Run durations were the tell: 76 seconds for a three-domain research scan, 65
for a thirteen-model benchmark. Nothing of that shape finishes that fast.

## The four rules

### 1. Preflight before work, not after

First command, before any scanning, drafting or model calls:

```bash
node scripts/ops/routine-digest.mjs preflight --routine <name>
```

It proves the sink is reachable — git identity, remote auth, a writable digest
path. Non-zero exit means **stop and report red without doing the work.** Work
that cannot be persisted is work thrown away; spending tokens first makes the
loss larger, not smaller.

### 2. Never call opt-in-gated orchestration from a routine

Tools that require the user to ask for them in their own words cannot be
satisfied by a cron prompt. In Claude Code this is the `Workflow` tool; other
harnesses have equivalents. The call is declined or errors, and the session
still ends green.

A workflow or pipeline file is a **specification you follow**, not a thing you
invoke. Read its phases and execute them yourself with ordinary tools, or call a
plain script. Any routine prompt containing such a call is broken by
construction, however green its history looks.

This rule is scoped to unattended sessions. An interactive session where the
user asked for orchestration is exactly where those tools belong.

### 3. Finish with the digest — three bullets, always

Last command, always:

```bash
node scripts/ops/routine-digest.mjs emit \
  --routine <name> --status green|amber|red \
  --bullet "what was found or produced, with a number or a path" \
  --bullet "what changed, or what is blocked and on whom" \
  --bullet "cost, next action, or what a human must decide"
```

Exactly three. They are the deliverable, not a summary of it — **they are what
the operator reads instead of opening the artifact.** Vacuous bullets ("done",
"n/a", "no changes") are rejected: a content-free digest is the same void loop
wearing a hat.

`emit` appends to a monthly digest and a JSONL ledger, commits, pushes, and
**exits non-zero if any of that failed.** That exit code is the whole design: a
routine that cannot persist goes red instead of green-and-empty. Never work
around that failure — it is the mechanism.

### 4. Status means something

| Status | Meaning |
|---|---|
| `green` | Did its job and committed the result. |
| `amber` | Ran, but degraded — a key missing, a source down, scope cut. Say which, in a bullet. |
| `red` | Could not do its job. Say what blocked it and who unblocks it. |

Never report green to look tidy. Amber with a named cause is a working signal; a
false green is how a fleet stays broken for weeks.

## Verifying a fleet

Check the repo, not the run status:

```bash
node .claude/ci/routine-drift-check.mjs
```

For each routine in `routines.config.json` it compares the newest ledger entry
against that routine's cadence window. A routine that fired with no ledger line
did not do its job, whatever run-history says. It exits 2 — not 0 — when it
cannot run, because a check that has gone blind must not read as success.

## Boundaries

Discovery routines still discover. The contract adds a durable report; it does
not grant permission to publish, send, merge, or auto-fix. Committing a digest
is a report, not a licence to ship.

## When a routine's config is not yours to change

Some platforms only let an agent edit automation it created itself. Where the
schedule, model, or prompt is owned by a human or another system, put this
contract in files the session loads anyway — `CLAUDE.md`, `AGENTS.md`, or the
equivalent. A repo-side contract reaches every routine that checks the repo out,
without touching a single trigger. `contract.snippet.md` in this pack is that
block, ready to paste.
