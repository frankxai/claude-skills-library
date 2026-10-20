# Skill evals

Each folder here tests one skill from `free-skills/` with the official `claude plugin eval` runner. Every case runs twice: once with the skill loaded, once without it, on the same model and prompt. The scorecard reports both and the difference, so a skill only earns a claim when it beats the base model on a task with a checkable answer.

```bash
node scripts/eval-skill.mjs ui-ux-design-expert
```

The script stages a throwaway plugin in your temp folder (manifest, the skill from `free-skills/`, and its cases), runs the eval with a cost ceiling of $5 and a pinned judge model, and writes `SCORECARD.md` and `results/<date>.json` into the skill's folder here. `--stage-only` stages without running; `--runs`, `--max-cost-usd` and `--judge-model` override the defaults.

## How a suite is built

- **Seeded defects measure recall.** A fixture with known, planted problems. Deterministic regex graders check that each one is named; an LLM grader checks that each finding points at the right element and comes with a concrete fix. The planted problems are listed in `KEY.md`, which is never staged into a run.
- **A clean fixture measures precision.** A correctly built version of the same kind of page. The grader fails the run if the review invents problems.
- **Read-only tools only.** Cases allow `Read`, `Glob`, `Grep` and `Skill`. On native Windows the runner refuses any case that grants a shell, so these suites run on every platform.
- **Skill firing is reported, not scored.** The `skill-fired` grader shows whether Claude chose to load the skill, without counting toward the score.

## Requirements

Claude Code 2.1.269 or later, Git 2.31 or later, and a signed-in `claude` CLI: the eval runs Claude as you, on your plan. The first run costs real tokens. Keep the ceiling.
