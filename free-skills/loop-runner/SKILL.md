---
name: loop-runner
description: Execute exactly one disciplined iteration of a designed loop from .loop/<name>/ (LOOP.md charter + state.json + journal.md). Use when asked to "run the loop", "run one iteration of <loop>", "continue the <name> loop", or when invoked on a cadence (cron, /loop, while-loop) against a loop directory. Works identically under Claude Code, Codex, Gemini CLI, or any coding agent — state lives in files, not in this conversation.
---

# Loop Runner

You are one iteration of a durable loop. You start cold, you finish clean, and everything you learn goes into files — the next iteration (possibly a different agent, possibly you tomorrow) knows only what the loop directory says. Run **exactly one unit**; resist finishing "just one more".

## The iteration protocol

Execute in order. Do not skip, reorder, or batch steps.

### 0 · Load

Read, in this order: `.loop/<name>/LOOP.md` (the whole charter), `state.json`, the
**last 3 entries** of `journal.md`, and `backlog.md` if the archetype uses one. Do
not read the full journal — old entries are archive, not context.

### 1 · Gate

Refuse to run (exit with one journal line explaining why) if ANY of:

- `.loop/STOP` or `.loop/<name>/STOP` exists — the operator's kill switch. Never
  delete a STOP file.
- `status` is `paused`, `stalled`, `blocked`, `done`, or `retired` — only an operator
  or the orchestrator changes those.
- `iteration >= budget.max_iterations`.
- Done-when already passes → set `status: done`, journal it, report, stop.
- The working tree is dirty with changes this loop didn't journal → set `status:
  blocked`, escalate per charter (H4 debris — a prior iteration died; a human or the
  orchestrator must adjudicate, not you).

Then check `.loop/<name>/STEER.md`. If present, it is live operator steering:
incorporate it into this iteration's choices, quote it in the journal entry, then
delete the file. Steering outranks the journal's `Next:` hint but never overrides
Guardrails or promotion mode.

### 2 · Pick

Select the single unit per the charter's Iteration contract (top eligible backlog
item; next failing test; the current blocker for a babysitter; …). If the last
journal entry's `Next:` names a unit, prefer it unless it's now ineligible. If the
same unit appears in the last 2 entries with ❌, you MUST take a different approach
or escalate — never re-run a failed approach verbatim.

### 3 · Do

Complete the unit within the charter's Guardrails and wall-clock budget. Touch only
what the unit requires. If mid-unit you discover it's oversized, stop at a coherent
boundary, split the remainder into new backlog items, and treat the completed part as
your unit.

### 4 · Verify

Run every command in the charter's Verification section and read the ratchet via its
"Read via" command. This step is not optional and not skippable under time pressure —
an unverified unit is a failed unit. **Evidence, not assertions**: the journal gets
the actual command output (exit code, counts, failing test names), never "tests
pass". You may not record a result you did not observe this iteration. An iteration
that produced no changes counts as no ratchet movement (`stall_count+1`), even if
nothing failed.

- All pass + ratchet moved right (or held, for non-ratchet units) → proceed.
- Ratchet regressed → **revert your changes now** (git restore / revert), journal the
  regression with the ❌ flag. Do not debug forward. Do not leave the regression for
  the next iteration.
- Verification fails → fix within budget or revert. Never record a ❌ unit as done.

### 5 · Record

In this order (order matters — a crash between steps must never leave done-looking
state with no evidence):

1. Append the journal entry (format in the loop's `state-schema` reference — Unit /
   Did / Verify with actual command output / Ratchet old→new / Next / Flags).
2. Update `state.json`: `iteration+1`, `ratchet.value` (and `best`), `stall_count`
   (0 if moved, +1 if not), `clean_cycles` (+1 if clean; reset to 0 on any ❌,
   regression, or guardrail near-miss), `last_run`, `last_agent`.
3. Strike through / advance the unit in `backlog.md`.
4. Commit if the loop's promotion mode allows it; otherwise leave the change as a
   proposal per the charter (branch, PR, or staged diff — whatever the charter says).
   Working tree must end clean-or-committed either way.

### 6 · Report & handoff

- `stall_count >= stall_threshold` → set `status: stalled` and escalate per the
  charter's Escalation channel — a real message to a human, not a journal line.
- Done-when now passes → `status: done`, escalate the good news the same way.
- Otherwise: one-line report (`iteration N: <unit> ✅, ratchet X→Y, next: <unit>`)
  and stop. **Never start iteration N+1 yourself** — cadence belongs to the
  scheduler (cron, /loop, while-loop, orchestrator), not to you.

## Hard rules

1. **One unit per iteration.** The loop's convergence proof depends on it.
2. **Files are the only memory.** Anything worth knowing goes in journal/state/backlog
   before you exit.
3. **Propose-only means propose-only.** If `promotion.mode` is `propose-only`, you do
   not commit to protected branches, publish, send, deploy, or spend — no matter what
   the unit seems to need. The gate is the point.
4. **Escalations must leave the loop directory.** Slack, PR comment, inbox file —
   per charter. Journal-only escalation is a silent failure.
5. **Never edit LOOP.md.** Charter changes are the designer's/operator's job. If the
   charter is wrong, escalate with the specific defect.

## Running under different harnesses

The protocol is identical everywhere; only the scheduler differs.

| Harness | One iteration | Cadence |
|---|---|---|
| Claude Code | `claude -p "run one iteration of .loop/<name> per loop-runner" --output-format json` | native `/loop 30m <same>`, Stop-hook driver, or cron |
| Codex CLI | `codex exec --sandbox workspace-write --output-last-message /tmp/out.md "run one iteration of .loop/<name> per the loop-runner skill"` | `while :; do codex exec "…"; sleep 1800; done` or cron |
| Gemini / Grok / other | equivalent one-shot exec with the same instruction | cron / while-loop |
| Cloud (CCR routines, Actions) | schedule the one-iteration instruction | platform cron |

Driver-loop notes: agent progress streams to stderr, final message to stdout — keep
stdout clean for the driver to parse. In CI, scope API keys to the single exec
invocation (never job-level env — repo-controlled code inside the loop can read job
env). Fresh context per iteration is a feature — do not "optimize" it away by running
many iterations in one long session; that reintroduces the context rot the loop
exists to prevent.
