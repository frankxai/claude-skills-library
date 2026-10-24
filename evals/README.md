# Skill evals

This folder is the one place skill evals live. Every suite tests the skill in `free-skills/<skill>/` directly; nothing here copies a skill, and `scripts/tests/eval-skill.test.mjs` fails if a suite points at a skill that does not exist or a second copy appears under `packs/`.

Two lanes answer two different questions.

| Lane | Question | Runner | Where |
|---|---|---|---|
| Lift over baseline | Does loading the skill make Claude do better than the same model without it? | `scripts/eval-skill.mjs` on the official `claude plugin eval`, with a no-skill baseline arm | `evals/<skill>/<case>/` |
| Cross-model transfer | Does the skill, used as a system prompt, make six models from six families produce the right thing? | `evals/skill-eval/run.mjs` through Vercel AI Gateway, graded by a model from a different family | `evals/skill-eval/cases.json` |

A skill earns a public claim only from a lift run whose scorecard says **Comparable run**, plus a cross-model run graded by another provider. Same-provider grading is recorded as a caveat, never as the independent check.

## Layout

```
evals/
  <skill>/<case>/            lift cases: prompt.md + graders/*.md, or a single case.yaml
  <skill>/<case>/KEY.md      answer key for seeded defects; never staged into a run
  <skill>/SCORECARD.md       written by the latest lift run
  <skill>/results/<stamp>.json
  skill-eval/                cross-model lane: run.mjs, cases.json, run.test.mjs
  _runs/<date>-<name>/       archived multi-skill runs, kept as evidence with their caveats
```

## Run the lift lane

```bash
node scripts/eval-skill.mjs ui-ux-design-expert --runs 3 --max-cost-usd 5
```

The script stages a throwaway plugin in your temp folder (manifest, the skill from `free-skills/`, and its cases), runs `claude plugin eval` with the baseline arm, a cost ceiling and a pinned judge model, and writes `SCORECARD.md` and `results/<stamp>.json` into the skill's folder. `--stage-only` stages without running. Exit 0 means a comparable result was written; exit 3 means a result was written but the arms are not comparable, so it supports no claim.

Requirements: Claude Code 2.1.269 or later, Git 2.31 or later, and a signed-in `claude` CLI (`claude auth status` should say `"loggedIn": true`). The eval runs Claude as you, on your plan. Keep the ceiling.

In CI, adding the `run-lift-eval` label to a PR runs the lift lane for the skills listed in `LIFT_SKILLS` in `.github/workflows/skill-eval.yml`, on the plan behind the `CLAUDE_CODE_OAUTH_TOKEN` repository secret, and uploads the scorecards as the `lift-scorecards` artifact. Nothing else triggers it. Copy the scorecards into the branch by hand; the job has read-only repository access. Because the job runs that PR's own `scripts/eval-skill.mjs` with the token in its environment, it also requires the repository variable `LIFT_APPROVED_SHA` to equal the PR's head SHA: review that exact revision, set the variable (`gh variable set LIFT_APPROVED_SHA --body <sha>`), then add the label. A later push changes the SHA and the job stays off. Fork PRs are skipped, and the job fails if the token is missing or any skill's result is not comparable.

## Run the cross-model lane

```bash
cd evals/skill-eval && pnpm install
AI_GATEWAY_API_KEY=... MAX_USD=2 SKILL=ui-ux-design-expert node run.mjs
```

`SKILL` limits the run to one skill. Without keys every lane reports `UNAVAILABLE` and nothing is spent. Details and limits: `skill-eval/README.md`.

## How a lift suite is built

- **Seeded defects measure recall.** A fixture with known, planted problems. Each grader checks that one planted problem is named against the right element with a concrete fix. The planted problems are listed in `KEY.md`, which is never staged.
- **A clean fixture measures precision.** A correctly built version of the same kind of page. The grader fails the run if the review invents problems.
- **Self-contained prompts.** The eval sandbox starts empty. A prompt that refers to "our code" with no fixture gives every arm nothing to work on; the 2026-10-06 run lost two skills to this.
- **Read-only tools where possible.** On native Windows the runner refuses any case that grants a shell.
- **Skill firing is reported, not scored.** The `skill-fired` grader shows whether Claude chose to load the skill without counting toward the score. A `no-trigger` case checks the skill stays quiet on an unrelated task.

## Status

| Skill | Lift cases | Last lift run | Cross-model case |
|---|---|---|---|
| ui-ux-design-expert | seeded-defects, clean-form | none yet | yes |
| book-publishing | seeded-defects, clean-chapter, no-trigger | none yet | no |
| excellence-book-writing | seeded-defects, clean-section, no-trigger | none yet | no |
| feynman-thinking, langgraph-patterns, mcp-architecture | outcome-a, outcome-b, no-trigger | 2026-10-06, partial and self-graded (`_runs/`) | yes |
| agentic-orchestration, ai-architect-review, hooks-automation, loop-designer | outcome-a, outcome-b, no-trigger | 2026-10-06, partial and self-graded (`_runs/`) | no |
| model-routing, todo-discipline, verification-quality | outcome-a, outcome-b, no-trigger | never ran (cost ceiling hit first) | no |
| github-code-review, nextjs-expert, product-management-expert | seeded-defects, clean, no-trigger | none yet (added for the skills-with-evals pack, RC1) | no |
| skill-builder | seeded-defects, clean, write-skill, no-trigger | none yet (RC1) | no |

RC1 (2026-10-24) also replaced the outcome-a/outcome-b cases of mcp-architecture, ai-architect-review and langgraph-patterns with seeded-defects and clean cases (the old ones are in each suite's `_legacy-2026-10-06/`, not staged), added a no-trigger case to ui-ux-design-expert, and fixed the book-publishing and excellence-book-writing no-trigger cases, which never loaded (invalid `\s` escapes in double-quoted YAML). Pack manifest: `products/skills-with-evals/pack.json`.

The cross-model lane also covers six skills with no lift suite yet: social-media-strategy, nextjs-react-expert, product-management-expert, claude-sdk, suno-ai-mastery, video-production-workflow. No skill has a comparable, independently graded result yet.
