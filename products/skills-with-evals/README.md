# Skills that ship with their evals — release candidate 1

Status: **release candidate, not for sale.** No price, no checkout, nothing published. Registry row:
`claude-skills-eval-pack` in `frankxai/starlight-estate/graph/products.graph.json` (stage `concept`).

**The bet:** a skill without an eval is a claim. Every skill in this pack ships with:

1. **An eval suite** run by the official `claude plugin eval` (Claude Code 2.1.310), in `evals/<skill>/`.
2. **A no-skill baseline:** every case also runs with no skill loaded, same model and prompt, so lift is a
   measured difference, not an opinion (`--ablation with-without`).
3. **A trigger test:** a should-trigger case with a `tool_used: Skill` indicator, a should-not-trigger case on
   an adjacent task, and a static check (`scripts/trigger-lint.mjs`) that the "use when" cue comes early enough to
   survive Codex trimming descriptions on large installs (about 104 characters with 114 skills installed,
   full text with 40 or fewer: `receipts/codex-skill-list-budget.md`).
4. **A measured lift** on a one-page card (`evals/<skill>/CARD.md`), generated from the tool's result file. Until a
   comparable run exists, the card says "Not measured yet. No lift is claimed."

## Install

```bash
# Claude Code (tested 2.1.310). Until merged, pin the branch with #:
claude plugin marketplace add frankxai/claude-skills-library#agent/hyperagent/eval-pack-rc1
claude plugin install skills-with-evals@claude-skills-library

# Codex (tested codex-cli 0.164.0). Until merged, pin the branch with @:
codex plugin marketplace add frankxai/claude-skills-library@agent/hyperagent/eval-pack-rc1
codex plugin add skills-with-evals@claude-skills-library
```

After merge, drop the `#…` / `@…` suffix. `node scripts/install-test.mjs` checks both runtimes in a throwaway HOME.

## The ten skills

| Skill | Buyer job | Suite |
|---|---|---|
| ui-ux-design-expert | Accessibility review of a page (most-read skill page) | 8 seeded WCAG defects, clean page, no-trigger |
| github-code-review | Merge-blocking review of a PR diff | 8 seeded bugs, clean diff, no-trigger |
| nextjs-expert | Next.js 16 App Router review (version changes that compile and then break) | 9 seeded defects, clean route, no-trigger |
| mcp-architecture | MCP server design and security review | 8 seeded defects, hardened server, no-trigger |
| ai-architect-review | Pre-launch review of an LLM system | 8 seeded flaws, sound design, no-trigger |
| langgraph-patterns | LangGraph agent debugging | 7 seeded defects, correct graph, no-trigger |
| skill-builder | Writing and reviewing Agent Skills | 8 seeded spec defects, clean skill, authoring case, no-trigger |
| product-management-expert | PRD review before build | 8 seeded gaps, strong PRD, no-trigger |
| book-publishing | Chapter edit against house rules (second most-read) | 8 seeded violations, clean chapter, no-trigger |
| excellence-book-writing | Long-form prose revision (third most-read) | 8 seeded anti-patterns, clean section, no-trigger |

Why these: the strongest daily buyer jobs for someone who runs skills every day (review a diff, a page, a
route, a server, a design, a PRD; write a skill), plus the three most-read skill pages in this repo
(traffic measured 2026-10-21 in PR #33). Every recall case pairs with a clean case so a skill cannot win
by inventing problems.

## Commands

```bash
node scripts/trigger-lint.mjs --pack products/skills-with-evals/pack.json   # static trigger check
node scripts/install-test.mjs                                              # Claude Code + Codex install, throwaway HOME
node scripts/run-pack-lift.mjs --dry-run                                  # stage all 10 suites, no model call
node scripts/run-pack-lift.mjs --by "<you>"                             # G1: all 10 skills, $5/skill, $50 total, subscription login
node scripts/eval-skill.mjs <skill> --runs 3 --max-cost-usd 5 --model sonnet   # one skill (needs claude login)
node scripts/eval-card.mjs                                                 # regenerate cards from result files
node --test scripts/tests/eval-pack.test.mjs scripts/tests/eval-skill.test.mjs
```

## Free core and pro pack

- **Free core (MIT, unchanged by this pack):** the skills in `free-skills/`, the static trigger lint and the
  install test.
- **Pro pack (proposed):** the eval suites and answer keys, the measured scorecards and cards, the harness
  runs, and an update channel that re-runs every suite when a model or a skill changes.

**Open decision for Frank:** this repository is public, so everything on this branch is readable. PR #33
and PR #46 already put suites in public drafts. Before anything is sold, decide whether pro assets move to
a private repository. Nothing here changes a licence.

## Receipts (release gate)

| Gate | What it proves | State |
|---|---|---|
| G0 | Every public claim is listed with its evidence | Posted on the PR |
| G1 | Eval counts printed by `claude plugin eval` | Load check done (31 cases load, 0 errors). Measured runs: `scripts/run-pack-lift.mjs` on a signed-in Claude Code (subscription, no API key); instructions in the PR #82 G1-local comment |
| G2 | A stranger installs from a clean clone, with screenshots | Install level: **local clean clone PASS in both runtimes**; the remote command failed before the pinned-branch fix (`receipts/g2/`). Outcome level (a buyer-agent reaches a result with the skill on three providers, as `PRODUCT-RELEASE-GATE.md` requires for agentic products) needs model credentials and is not done |
| G3 | Different-family model checks the claims | Brief in `G3-BRIEF.md`; not run yet |
