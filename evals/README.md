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
  <skill>/<case>/            lift cases: prompt.md (+ resources/), or a single case.yaml
  <skill>/results/<stamp>.summary.json   aggregates of a lift run (pack skills); raw output is private
  <skill>/CARD.md            generated from the newest summary
  skill-eval/                cross-model lane: run.mjs, cases.json, run.test.mjs
  _runs/<date>-<name>/       archived multi-skill runs, kept as evidence with their caveats
```

## Held-out half

For the ten skills in the skills-with-evals pack, the answer keys (`KEY.md`), every grader, the fixed twin of each
seeded input (the clean case's `resources/`: diffing it against the seeded input would reproduce the answer key),
the retired `_legacy-*` cases and all raw run output are **held out**. They live in a private folder outside this
repository and are never published. Publishing them would let a skill, or a model, be tuned to the answers, and every
lift number would stop meaning anything. In the public tree, a placeholder file with the same name says "Held out".

- `scripts/held-out.mjs status`: is the private half here? It is `$SKILLS_EVALS_PRIVATE`, or
  `../skills-with-evals-private` next to this repository.
- `scripts/eval-skill.mjs` adds the private half back when it stages a run. Without it, a pack skill refuses to run.
- Raw output (every grader verdict, the HTML report, the traces, `SCORECARD.md`) goes to `<private>/results/<skill>/`.
  The public record is `<skill>/results/<stamp>.summary.json`: totals only, never which planted problem a run found.
- `scripts/held-out.mjs check` and a CI test fail if anything held out shows up in the public tree.
- Counts that the method needs (planted problems, graders per case) are in `products/skills-with-evals/pack.json`
  (`heldOut`).

Until 24 October 2026 the held-out files were public on this branch, so they remain in its history. Any lift claim
made in public needs fresh cases that have never been published.

Suites outside the pack (the 2026-10-06 outcome cases) still keep their graders in place.

## Run the lift lane

```bash
node scripts/eval-skill.mjs ui-ux-design-expert --runs 3 --max-cost-usd 5
```

The script stages a throwaway plugin in your temp folder (manifest, the skill from `free-skills/`, and its cases), runs `claude plugin eval` with the baseline arm, a cost ceiling and a pinned judge model, and writes the raw output to the private half and an aggregate `results/<stamp>.summary.json` into the skill's folder (pack skills; see "Held-out half"). `--stage-only` stages without running. Exit 0 means a comparable result was written; exit 3 means a result was written but the arms are not comparable, so it supports no claim.

Requirements: Claude Code 2.1.269 or later, Git 2.31 or later, and a signed-in `claude` CLI (`claude auth status` should say `"loggedIn": true`). The eval runs Claude as you, on your plan. Keep the ceiling.

In CI, adding the `run-lift-eval` label to a PR runs the lift lane for the skills listed in `LIFT_SKILLS` in `.github/workflows/skill-eval.yml`, on the plan behind the `CLAUDE_CODE_OAUTH_TOKEN` repository secret, and uploads the scorecards as the `lift-scorecards` artifact. Nothing else triggers it. Copy the scorecards into the branch by hand; the job has read-only repository access. Because the job runs that PR's own `scripts/eval-skill.mjs` with the token in its environment, it also requires the repository variable `LIFT_APPROVED_SHA` to equal the PR's head SHA: review that exact revision, set the variable (`gh variable set LIFT_APPROVED_SHA --body <sha>`), then add the label. A later push changes the SHA and the job stays off. Fork PRs are skipped, and the job fails if the token is missing or any skill's result is not comparable.

**For the pack skills this CI lane is off until Frank decides how CI gets the private half** (for example a read-only checkout of a private repository). Without it, `eval-skill.mjs` refuses to run a pack skill, and the job must never upload raw scorecards, reports or traces as artifacts: they carry the held-out graders' verdicts.

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
| ui-ux-design-expert | seeded-defects, clean-form, no-trigger | none yet | yes |
| book-publishing | seeded-defects, clean-chapter, no-trigger | none yet | no |
| excellence-book-writing | seeded-defects, clean-section, no-trigger | none yet | no |
| langgraph-patterns, mcp-architecture | seeded-defects, clean, no-trigger | none yet on these cases (the 2026-10-06 partial, self-graded run used the legacy outcome cases, `_runs/`) | yes |
| ai-architect-review | seeded-defects, clean, no-trigger | none yet on these cases (the 2026-10-06 run used the legacy outcome cases) | no |
| product-management-expert | seeded-defects, clean, no-trigger | none yet (added for the skills-with-evals pack, RC1) | yes |
| github-code-review, nextjs-expert | seeded-defects, clean, no-trigger | none yet (RC1) | no |
| skill-builder | seeded-defects, clean, write-skill, no-trigger | none yet (RC1) | no |
| feynman-thinking | outcome-a, outcome-b, no-trigger | 2026-10-06, partial and self-graded (`_runs/`) | yes |
| agentic-orchestration, hooks-automation, loop-designer | outcome-a, outcome-b, no-trigger | 2026-10-06, partial and self-graded (`_runs/`) | no |
| model-routing, todo-discipline, verification-quality | outcome-a, outcome-b, no-trigger | never ran (cost ceiling hit first) | no |

RC1 (2026-10-24) also replaced the outcome-a/outcome-b cases of mcp-architecture, ai-architect-review and langgraph-patterns with seeded-defects and clean cases (the old ones are in each suite's `_legacy-2026-10-06/`, not staged), added a no-trigger case to ui-ux-design-expert, and fixed the book-publishing and excellence-book-writing no-trigger cases, which never loaded (invalid `\s` escapes in double-quoted YAML). Pack manifest: `products/skills-with-evals/pack.json`.

The cross-model lane (`skill-eval/cases.json`) also covers five skills with no lift suite yet: social-media-strategy, nextjs-react-expert, claude-sdk, suno-ai-mastery, video-production-workflow. A test checks this table against the suites on disk and that file. No skill has a comparable, independently graded result yet.
