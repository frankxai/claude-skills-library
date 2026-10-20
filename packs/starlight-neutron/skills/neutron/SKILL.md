---
name: neutron
description: Spend fewer tokens without lowering the ceiling. Use when a task will take more than about ten tool calls, before spawning subagents or choosing a model for delegated work, when context is filling up, or on "save tokens", "token budget", "cheaper way", "which model", "optimise this prompt", "this is burning context". Tightens a multi-part ask, picks model tier, reasoning effort, execution shape and output profile, and states the choice in one line.
---

# Neutron

Cut waste, never reasoning. Neutron decides how a task runs. It does not decide what the answer is, and it never trades correctness for a smaller bill.

Run the five steps in order. Skip a step when it clearly does not apply: a one-line question needs none of them. Total overhead is one short message.

## 1. Tighten the ask

Only when the request is multi-part, vague or long. Rewrite it as one block with five parts. Do not do the task yet.

1. **Goal and done-condition.** What exists or passes when this is finished.
2. **Scope.** Exact paths, repos, or systems. Name what is out of scope.
3. **Constraints.** Versions, style, things that must not change.
4. **Output shape.** Diff, file, table, one-line verdict. Length cap if one matters.
5. **Known facts.** What the user already established, so it is not re-derived.

Tightening removes repetition and ambiguity. It does not shorten sentences into fragments. Compressing the user's prompt makes answers longer and worse, because the model has to guess what was cut. Keep the user's meaning whole and their words where they carry it.

If the ask is genuinely ambiguous in a way that changes the work, ask one question. Otherwise state the assumption and go.

## 2. Pick the shape

Tiers are relative: smallest, mid and largest model available to you. Map them to current model names from your provider's list, or from a routing skill if one is installed (for example `model-routing`). Effort is the reasoning budget, low, medium or high.

| Work | Shape | Tier | Effort |
|---|---|---|---|
| Find, list, locate, count | Search subagent, returns paths and a verdict | Smallest | Low |
| Mechanical edit, rename, format, fixture | Inline, one pass | Small or mid | Low |
| Implement against a clear spec | Inline, test first | Mid | Medium |
| Ambiguous design, security, money, final review | Inline | Largest | High |
| 3 or more independent chunks, each over about 10 tool calls | Parallel subagents, one per chunk | Match each chunk | Match each chunk |

Rules that hold across rows:

- A task of 3 tool calls or fewer never gets a subagent. The briefing costs more than the work.
- A subagent returns at most 10 lines plus file paths and commit hashes. Raw search output stays in its context.
- One writer per working tree. Whoever reviews should not be the one who wrote it, and for consequential work should be a different model.
- The final judgment on anything consequential runs on the largest tier at high effort. Savings come from the search and the typing, not from the verdict.
- If a router skill or agent is installed, call it instead of re-deriving this table.

## 3. Pick the output profile

| Profile | Use for | Behaviour |
|---|---|---|
| Plain | Default for explanation, design, anything a person will study | Normal prose, answer first, no preamble or recap |
| Lean | Status updates, loop ticks, subagent returns, tool narration | Answer first, one idea per sentence, no ceremony, full sentences |
| Terse | Long sessions the user chose to run cheap | The upstream caveman skill, if installed. Fragments allowed, payload verbatim |

Never use Terse, and drop to Plain, for: security warnings, irreversible actions, step orders a fragment could scramble, a confused user, and anything written outside the chat (code comments, commits, docs, PRs, memory files, messages to third parties).

Compression applies to what the model says, not to how it thinks. Leave reasoning effort alone when the task is hard.

## 4. Keep the input clean

Most of a long session's cost is what the model reads, not what it writes.

- Search before reading. Read a range, not a file, unless the whole file is the task.
- Read a file once. Quote the lines that matter instead of re-reading.
- Shell output: RTK rewrites `git`, `grep`, test runs and similar to filtered forms through the plugin's hook. It changes nothing when it is not installed. Other compressors (headroom for logs and JSON) are opt-in and unproven until `neutron-log` shows they hold quality.
- To see what is wired, run the pack's `scripts/neutron.mjs doctor` (plugin root, or `.claude/neutron/scripts/` after `install.mjs`).
- Pass errors as the failing line plus the two lines around it, not the whole log.
- Keep the stable part of the context stable: system prompt, tool list and project instructions first, volatile material last. Editing instructions or tools mid-session breaks prompt caching and re-bills the prefix.
- Compact at a task boundary, not in the middle of an edit.
- Large always-loaded files (global instructions, rules, memory indexes) are the most expensive tokens you own, because every turn pays for them. Measure them before trimming anything else.

## 5. State the choice

One line, then proceed:

`neutron: <shape> on <tier> at <effort> effort, <profile> output, input via <compressor or plain>.`

Example: `neutron: search subagent on smallest tier at low effort, lean output, input via RTK.`

## Do not

- Do not compress code, commands, paths, numbers or quoted errors. They are the payload.
- Do not drop a negation, a unit or a version to save a token.
- Do not claim a saving you did not measure. Use `neutron-log`.
- Do not spawn agents to look busy. Depth of delegation is an outcome, not a plan.
- Do not apply Terse to the final answer of a consequential task.
