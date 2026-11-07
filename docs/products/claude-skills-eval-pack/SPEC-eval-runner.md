# Spec: eval-runner

Module id `eval-runner` · depends on `verdict-store` · status: existing deterministic suite, agent
suites proposed.

## Objective

Produce evidence that a skill changed an agent's behaviour, not just evidence that its Markdown is
well formed. `starlight/tools/eval-skills-suite.mjs` already runs deterministic checks, planted
faults and lift cases across 30 flagship skills. This module adds the agent-exercising layer:
`skill-used`, near-miss `not-skill-used`, and a scored task that only passes when the skill changes
the work.

## Tech stack

Promptfoo (`npx promptfoo@latest`), YAML configs beside `evals/promptfoo.yaml`, JSON run output,
Node for the aggregation step. Agent-skill eval mechanics are grounded in the Promptfoo guide
"Test Agent Skills" (opened 2026-11-07, `https://www.promptfoo.dev/docs/guides/test-agent-skills/`)
and the `promptfoo-evals` skill's CI rules (deterministic assertions first, explicit grader,
`--no-share` for private results).

## Commands

```text
npx promptfoo@latest eval -c evals/promptfoo.yaml --repeat 3 --no-cache -o evals/results.json --no-share
npx promptfoo@latest view
node starlight/tools/eval-skills-suite.mjs
node starlight/tools/gen-skills-graph.mjs
```

`--repeat 3` is for nondeterministic agent behaviour; `--no-cache` while editing skill text;
`-o results.json` so the receipt survives the terminal. Keep `--no-share` so private results do
not leave the machine.

## Project structure

```text
evals/
  promptfoo.yaml          # providers, tests, assertions
  fixtures/<skill>/       # same task files, one SKILL.md variant
  results.json            # generated, gitignored
  cases/<skill>.json      # positive + near-miss + output checks
starlight/ops/skill-eval-verdicts.json     # consumed by the graph
```

## Code style

Assertions are ordered cheapest-first; a routing assertion alone is never the verdict:

```yaml
defaultTest:
  options: { disableVarExpansion: true }
  assert:
    - type: skill-used
      value: agent-design-review
    - type: not-skill-used
      value: agentic-orchestration
    - type: javascript
      threshold: 0.7
      value: |
        const out = typeof output === 'string' ? JSON.parse(output) : output;
        return { pass: out.issues.length >= 2, score: out.issues.length / 2 };
```

Hold the model, task files and permissions constant between two skill versions; swap only the
`SKILL.md`. Any difference then comes from the skill text.

## Testing strategy

- Three layers per skill: positive prompt, near-miss that must route to a sibling, and an output
  check proving the skill changed the work.
- Planted faults: 90/90 caught today (`ops/skill-eval-verdicts.json`, 2026-10-25). Keep the
  fault suite; a grader that passes a planted defect is a failed grader.
- Record model, provider, settings and exact `SKILL.md` revision in every receipt so a run can be
  re-read and compared.
- Failure cases ship visibly. A suite with no failing case is a suite nobody tried to break.

## Boundaries

- Always: deterministic assertions first; explicit grader; `--no-share`; cite the revision.
- Ask first: adding a paid provider, raising a cost threshold, changing the grader model.
- Never: mock graders in a shipped verdict, claim PASS from a lint-only run, send personal data to
  a provider, or run evals against a real customer workspace.

## Success criteria

One suite per flagship skill with all three layers; planted faults still caught; every PASS has a
`results.json` receipt and a named revision; `gen-skills-graph.mjs` `withEval` equals the number
of PASS verdicts; the scoreboard reports G3 PASS.

## Open questions

`[OPEN]` which provider runs the agent suites and at what cost ceiling. No paid provider is used
until Frank rules on the spend. Deterministic and planted-fault layers stay free and local.
