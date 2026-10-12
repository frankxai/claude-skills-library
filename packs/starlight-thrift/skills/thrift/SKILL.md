---
name: thrift
description: Spend fewer tokens without lowering the ceiling. Use at the start of a heavy session, before delegating work, or on "save tokens", "token budget", "cheaper way", "which model", "optimise this prompt", "this is burning context". Tightens the ask, picks model tier, effort, execution shape and output profile, and states the choice in one line.
---

# Thrift

Cut waste, never reasoning. Thrift decides how a task runs. It does not decide what the answer is, and it never trades correctness for a smaller bill.

Run the five steps in order. Skip a step only when it clearly does not apply. Total overhead is one short message.

## 1. Tighten the ask

Rewrite the request as one block with five parts. Do not do the task yet.

1. **Goal and done-condition.** What exists or passes when this is finished.
2. **Scope.** Exact paths, repos, or systems. Name what is out of scope.
3. **Constraints.** Versions, style, things that must not change.
4. **Output shape.** Diff, file, table, one-line verdict. Length cap if one matters.
5. **Known facts.** What the user already established, so it is not re-derived.

Tightening removes repetition and ambiguity. It does not shorten sentences into fragments. Compressing the user's prompt makes answers longer and worse, because the model has to guess what was cut. Keep the user's meaning whole and their words where they carry it.

If the ask is genuinely ambiguous in a way that changes the work, ask one question. Otherwise state the assumption and go.

## 2. Pick the shape

| Work | Shape | Model tier |
|---|---|---|
| Find, list, locate, count | Search subagent, returns paths and a verdict | Smallest |
| Mechanical edit, rename, format, fixture | Inline, one pass | Small or mid |
| Implement against a clear spec | Inline, test first | Mid |
| Ambiguous design, security, money, final review | Inline, reasoning on | Largest |
| 3 or more independent chunks, each over about 10 tool calls | Parallel subagents, one per chunk | Match each chunk |

Rules that hold across rows:

- A task of 3 tool calls or fewer never gets a subagent. The briefing costs more than the work.
- A subagent returns at most 10 lines plus file paths and commit hashes. Raw search output stays in its context.
- One writer per worktree. Reviewers use a different provider from the maker.
- The final judgment on anything consequential runs on the largest tier. Savings come from the search and the typing, not from the verdict.
- If the room has a router (`model-routing`, `ecc:model-route`, `skill-router`, the Prompt Hub conductor), call it instead of re-deriving this table.

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
- Pipe bulky command output through a compressor when one is installed (RTK for shell output, headroom for logs, JSON and tool results). Run `node scripts/thrift.mjs doctor` to see what is wired.
- Pass errors as the failing line plus the two lines around it, not the whole log.
- Keep the stable part of the context stable: system prompt, tool list and project instructions first, volatile material last. Editing instructions or tools mid-session breaks prompt caching and re-bills the prefix.
- Compact at a task boundary, not in the middle of an edit.
- Large always-loaded files (global instructions, rules, memory indexes) are the most expensive tokens you own, because every turn pays for them. Measure them before trimming anything else.

## 5. State the choice

One line, then proceed:

`thrift: <shape> on <tier>, <profile> output, input via <compressor or plain>.`

Example: `thrift: search subagent on smallest tier, lean output, input via RTK.`

## Do not

- Do not compress code, commands, paths, numbers or quoted errors. They are the payload.
- Do not drop a negation, a unit or a version to save a token.
- Do not claim a saving you did not measure. Use `thrift-ledger`.
- Do not spawn agents to look busy. Depth of delegation is an outcome, not a plan.
- Do not apply Terse to the final answer of a consequential task.
