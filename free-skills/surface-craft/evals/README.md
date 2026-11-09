# surface-craft evals

Cases in the official `claude plugin eval` format (`case.yaml`, schema 1.1). The runner finds a
skill's `evals/` folder by itself once the skill sits inside a plugin.

| Case | Kind | Graders |
|---|---|---|
| `hero-headlines` | should trigger | skill fired, claim ledger present, no banned headline pattern |
| `product-page` | should trigger | skill fired, claim ledger present, no banned headline pattern, honest scarcity |
| `visual-direction` | should trigger | skill fired, direction avoids the anti-slop defaults |
| `no-trigger-standup` | should not trigger | skill not fired |
| `no-trigger-commit-message` | should not trigger | skill not fired |
| `no-trigger-code-explain` | should not trigger | skill not fired |

## Run

The runner calls the model, so it needs a signed-in `claude` CLI (or a token) and network.
Stage the skill into a throwaway plugin and point the runner at it:

```bash
mkdir -p /tmp/sc-eval/.claude-plugin /tmp/sc-eval/skills
echo '{"name":"surface-craft-eval","version":"0.0.0"}' > /tmp/sc-eval/.claude-plugin/plugin.json
cp -r free-skills/surface-craft /tmp/sc-eval/skills/
claude plugin eval /tmp/sc-eval --runs 3 --no-publish --threshold 0
```

## First run (2026-11-09)

One run per arm, with-without ablation, Claude Code 2.1.319, judge model default (haiku),
total cost USD 0.58. All six cases scored 1.00 with the skill.

| Case | With skill | Without | Delta |
|---|---|---|---|
| hero-headlines | 1.00 | 0.50 | +0.50 |
| product-page | 1.00 | 0.67 | +0.33 |
| visual-direction | 1.00 | 1.00 | 0.00 |
| three no-trigger cases | 1.00 | 1.00 | 0.00 |

The lift came from the claim-ledger grader: the baseline never produced one. The baseline
passed the banned-headline, honest-scarcity and anti-slop graders on its own, so those graders
do not yet separate the arms. One run per arm is a smoke test, not evidence; rerun with
`--runs 3` or more before quoting any number.
