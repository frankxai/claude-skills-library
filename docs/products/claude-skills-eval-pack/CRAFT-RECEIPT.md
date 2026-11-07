# Craft receipt — claude-skills-eval-pack — 2026-11-07

Product id `claude-skills-eval-pack`. Validator:
`node tools/craft-receipt.mjs --product claude-skills-eval-pack --receipt <path>`.
This receipt covers the **definition suite** at
`docs/products/claude-skills-eval-pack/` on branch `agent/opencode/eval-pack-definition-20261107`.
It does not claim a product, a page or a package was shipped.

## Research

Three or more sources with URL and read date, all opened live on 2026-11-07:

1. Promptfoo, "Test Agent Skills" — https://www.promptfoo.dev/docs/guides/test-agent-skills/ .
   `skill-used`, near-miss `not-skill-used`, deterministic assertions first, `--repeat 3`,
   `--no-cache`, `-o results.json`. Read 2026-11-07.
2. Anthropic, `anthropics/skills` README —
   https://raw.githubusercontent.com/anthropics/skills/main/README.md . Skill format, spec,
   licenses, and the disclaimer asking buyers to test skills themselves. Read 2026-11-07.
3. skills.sh, the agent skills directory — https://www.skills.sh/ . Cross-agent discovery ranked
   by installs. Read 2026-11-07.
4. Linear changelog, 5 November 2026 — https://linear.app/changelog . Narrow-width wrapping,
   plain agent status labels, mobile diff review, AI credit usage explorer. Read 2026-11-07.

Buyer named in [PRD.md](PRD.md): a developer installing skills into Claude Code, Cursor, Codex or
OpenCode who has been burned by a skill that read well and behaved badly. What they use today:
Anthropic's reference skills, an install directory such as skills.sh, or writing the skill
themselves. Registry `mustBeat[]` names the same three.

Local evidence: `graph/products.graph.json` (row, stage `concept`, gate `UNGATED`),
`gh api repos/frankxai/claude-skills-library/traffic/views` (1,347 views / 721 uniques,
14-day API window, `views[]` has 14 entries from 2026-10-23 to 2026-11-05),
`graph/skills.graph.json` (936 `SKILL.md`, 606 names, 0 conflicts, 115 versioned, 30 with an eval),
`ops/skill-eval-verdicts.json` (30 PASS, planted faults 90/90, updated 2026-10-25),
`packages/demand-capture/report.mjs` (exit 1, KV credentials missing). All measured 2026-11-07
except the verdict store's own date.

## Bar

`mustBeat[]` copied from `graph/products.graph.json`:

| Reference | Beat / not-beat | Dimension |
|---|---|---|
| the 103 free skills in this same repo | **not beat yet** | proof: those skills have no published verdict; 576 of 606 resolved names are `UNEVALUATED` today |
| awesome-claude-prompts and every other unevaluated skill list | **beat on the evidence model, not yet shipped** | a public directory cannot show a run receipt; our spec requires one per PASS (SPEC-catalog) |
| writing the skill yourself in an afternoon | **beat on time-to-trust, not yet shipped** | the gift is a skill plus its eval suite and the run output showing which cases fail |

External bar, named per §5b obligation 2: `anthropics/skills` on **proof instead of prose**. Its
README disclaims and asks the buyer to test; this product publishes the test, its passes and its
failures. skills.sh on **behavioural evidence instead of install counts**. "Comparable" would be a
failing verdict. No superiority claim is made: the pack is not published, G1 is 4.95%, G7 is
`UNGATED`.

## Refinement

Second pass, after the suite rendered as a complete draft. Before snapshots are committed in this
branch at `docs/products/claude-skills-eval-pack/evidence/before/`; the after files are the current
docs. Measured with `git diff --no-index --stat <before> <after>`:

```text
PRD.md                   | 17 ++++++++++++++---   (14 insertions, 3 deletions)
DESIGN-EXPECTATIONS.md   |  4 ++--               (2 insertions, 2 deletions)
```

Plus a mechanical prose pass over 10 files replacing em dashes with hyphens (the humanizer rule in
`AGENTS.md`). Substantive changes: added a Failure and recovery section to the PRD (fails-closed
catalog, honest capture errors, idempotent gift retry, same-session revert) and removed a
"next-gen" self-description from the design expectations. A slop scan for the banned vocabulary
was run across every `.md` before and after; the only remaining occurrences are the rule text that
names those words as banned.

## Critique

Independent reviewer: an `oracle` subagent, a different reviewer context from the maker
(OpenCode). Reviewed revision: branch `agent/opencode/eval-pack-definition-20261107` at base
`2f980f5` plus the suite files. Codex (`gpt-6.1-sol`, a different provider) was attempted first as
the checker and hung on a marketplace auto-update; that failure is recorded, not hidden. A
same-provider critique would be recorded as missing under section 5b.1. This review is an
independent context, so the stricter different-provider clause remains a listed gap.

Verdict: **REWORK**. Eight findings, all fixed at this revision:

1. **P0** G7 could turn green from a regex on `products.graph.json` with zero receipt files,
   contradicting SPEC-publication.md. Fix: G7 now requires dated receipt files covering G0-G5
   with evidence paths, plus the gate string.
2. **P1** G9 could pass with the Critique block still open. Fix: G9 reads the Critique section and
   requires a named reviewer, findings, fixes and a revision hash; the header validator alone is
   no longer enough.
3. **P1** "30-day window" was wrong: `traffic/views` returns 14 daily entries. Fix: every label
   now states the 14-day API window, and the two dated snapshots are marked non-comparable.
4. **P1** staleness was promised in three documents but never enforced. Fix: G3 compares each
   verdict's `evaluatedAt` with the owner `SKILL.md` mtime and fails on any stale verdict.
5. **P2** G3 hardcoded `90/90`. Fix: parse `a/b`, require `a === b` and `b >= 90`.
6. **P2** G1's top-10 half collapsed when popular paths were not `SKILL.md` paths. Fix: broader
   slug extraction and `[OPEN]` when the ranking is incomplete.
7. **P2** unverifiable `$67` traces and purgeable refinement evidence. Fix: the `$67` claims are
   removed, the README's "Would you pay?" CTA is labelled a public ask only, and the before
   snapshots are committed under `evidence/before/`.
8. **P2** the scoreboard assumed one worktree layout. Fix: walk up for the
   `graph/skills.graph.json` marker; exit 2 with a clear message when it is missing.

Strengths the reviewer asked to keep: honest `UNGATED`, 4.95% and "not beat yet" wording, no
seeded counts, capture fails closed, and most numbers carry their generating commands. Fixes are
verified by re-running the scoreboard and the craft-receipt validator at this revision.

Remaining gap: a different provider did not complete a review. Codex was attempted and failed on
startup, so the critique is an independent context rather than a proven second provider.
