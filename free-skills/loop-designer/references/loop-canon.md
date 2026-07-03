# The loop canon — sources and the rules they converge on

The distilled doctrine behind this skill family, with attribution. Read when you want
the *why* behind a design rule or need to go deeper on a lineage.

## Lineages

**Geoffrey Huntley — the Ralph loop** (ghuntley.com/ralph, /loop, /stdlib, /specs;
github.com/ghuntley/how-to-ralph-wiggum). `while :; do cat PROMPT.md | agent; done`.
Fresh context per iteration; disk + git as the only memory; separate planning loop
(gap analysis, "don't assume not implemented") from building loop (pick the most
important thing, do it completely, validate, commit); numbered guardrails where
higher = more critical; the plan is disposable — regenerate on drift; failures become
"signs"; "your job is to sit on the loop, not in it"; convergence is eventual
consistency, tuned like a guitar. Existence proof: a compiler built by a 3-month
loop (CURSED).

**Pete Steinberger — loop engineering with taste** (steipete.me; steipete/agent-scripts;
OpenClaw heartbeat/cron docs). "You shouldn't be prompting coding agents anymore.
You should be designing loops that prompt your agents." A serious loop has a testable
goal, a checkable termination, hard bounds. Blast-radius sizing; anomalous duration
as the drift alarm; CLIs over MCPs so the agent can close its own verify loop;
AGENTS.md as agent-written "organizational scar tissue", pruned as models improve;
heartbeat vs cron split; the silence contract (`HEARTBEAT_OK`); and the counterweight:
blind spec-in/product-out "Ralphing" slops you into a corner — human taste stays in
the loop as evaluator.

**Boris Cherny — verification doubles quality** (Claude Code best practices;
"loop engineering" interviews). "I no longer prompt Claude directly… my job is to
write loops." Give the agent a way to verify its work (2–3×
quality); split the agent that writes from the agent that checks — a model grading
its own output is too generous; escalating gates (same-prompt check → per-turn goal →
deterministic Stop hook → adversarial second model); evidence, not assertions.

**Anthropic — the long-running harness** (anthropic.com/engineering: effective
harnesses, building effective agents; github.com/anthropics/cwc-long-running-agents).
Initializer agent writes the plan; coding agent makes one increment per fresh
session; state in `PROGRESS.md` + default-FAIL `test-results.json`; an evidence gate
(hook) blocks claiming success without opening the evidence; a tool-restricted fresh
evaluator returns PASS/NEEDS_WORK; STEER.md for mid-run redirection; kill-file stop;
"it is unacceptable to remove or edit tests." Loop = gather context → act → verify →
repeat; stop at completion or max-iterations.

**HumanLayer — 12-factor control flow** (github.com/humanlayer/12-factor-agents,
factor 8). Own the loop in deterministic code; the model returns intents; high-stakes
intents (money, sends, deploys) break the loop and await a human — never loop through
irreversible actions. The promotion-gate design descends from this.

**Fleet scale** (Steve Yegge's Gas Town; snarktank/ralph; iannuttall/ralph;
vercel-labs/ralph-loop-agent). Persistent coordinator + ephemeral one-task workers +
monitors + a merge-queue ratchet; machine-readable story queues with `passes:false`
contracts and exact-string completion promises; stale-lock reopening for crashed
iterations; composable stop conditions (iterations / tokens / cost); the judge's
*reason* feeds the next iteration.

## The convergent rules (where all lineages agree)

1. One unit of work per iteration, sized to one context window.
2. Fresh context per iteration; state on disk + git, never in conversation.
3. A ratchet that cannot move backwards, enforced by gates, with weakening it
   forbidden in writing.
4. Machine-checkable, default-FAIL completion signals; evidence before claims.
5. Separate planning from building; the plan is disposable.
6. Writer ≠ checker; the checker is fresh, tool-restricted, ideally a different model.
7. Cap everything: iterations, wall-clock, tokens, retries, concurrency.
8. Every observed failure becomes a permanent sign; prune stale signs.
9. Irreversible actions break the loop to a human; autonomy is earned in cycles, not
   granted.
10. The operator sits on the loop — watching failure classes and upgrading the
    system between runs is where the leverage is.

## Where they disagree (and what this skill family chose)

- **Fresh vs warm context.** Huntley: always fresh. Steinberger: warm sessions with
  strong models, serialize tasks. *Chosen:* fresh per iteration for unattended loops
  (the failure mode of warm — context rot — is silent; the cost of fresh — re-reading —
  is visible and bounded).
- **Full autonomy vs human taste.** Huntley optimizes for unattended weeks;
  Steinberger keeps the human as evaluator. *Chosen:* both, staged — propose-only
  loops run unattended, write access is earned through checker-verified clean cycles
  plus human approval, and taste checkpoints are chartered.
- **Revert vs morph forward.** This family reverts regressions (ratchet discipline);
  Steinberger never reverts, morphs forward. *Chosen:* revert inside unattended
  iterations (no human present to steer a morph), morph in attended sessions.
