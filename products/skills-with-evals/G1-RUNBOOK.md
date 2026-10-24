# G1 runbook: measure the pack on your own Claude Code

One command, on your Claude subscription, no API key. It runs every skill's tests twice (with the skill and with no
skill), keeps every unedited trace, stops at the cost caps, and regenerates the cards from the results.

## At breakfast

```powershell
cd C:\Users\frank\starlight\repos\csl-g1          # the worktree; first time: see "Once" below
git pull
node scripts/run-pack-lift.mjs
```

Optional first: `node scripts/run-pack-lift.mjs --pilot` (one skill, 6 runs, $1 cap) to see the time and cost per run.

When it finishes:

```powershell
node scripts/run-pack-lift.mjs --check-outputs    # every file present, traces match runs, isolation holds, cards current
git add evals products/skills-with-evals/receipts
git commit -m "evals: G1 run (subscription)"
git push
```

## Once (first time only)

```powershell
cd C:\Users\frank\starlight\repos\claude-skills-library
git fetch origin agent/hyperagent/eval-pack-rc1
git worktree add ..\csl-g1 agent/hyperagent/eval-pack-rc1
Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
claude auth status --text        # if not signed in: claude auth login, then choose the Claude subscription
```

Needs Claude Code 2.1.269 or later (tested on 2.1.310), Node 22 or later, and a repo path without spaces.

## What it does

1. **Preflight**, which stops before any model call if you are not signed in, or if it would bill an API key.
2. For each of the 10 skills: stages the skill and its tests, runs `claude plugin eval` with a no-skill baseline arm,
   3 runs per case per arm, model `sonnet`, judge `haiku`.
3. **Caps:** $5 per skill, $50 in total (`--per-skill-usd`, `--total-usd`). A skill that hits its cap is marked not
   comparable and the run moves on. On a subscription these figures are the harness's own estimate counted against
   your plan, not a bill.
4. **Stops early** on a login or rate-limit failure. Resume later with `--skills <the rest>`.
5. Reads every run's trace and marks a skill not comparable if anything besides the skill under test and Claude Code's
   built-ins loaded, or if the no-skill arm loaded the skill.
6. Regenerates every `CARD.md` and writes a run summary.

## Expected output files

| Per skill | Count |
|---|---|
| `evals/<skill>/results/<stamp>.json` (the tool's result, with run metadata and hashes) | 1 |
| `evals/<skill>/results/<stamp>.report.html` (Claude Code's report: scores, prompts, grader verdicts) | 1 |
| `evals/<skill>/results/<stamp>/traces/<case>__<with or without>__<n>.jsonl` (unedited run traces) | 18 (skill-builder: 24) |
| `evals/<skill>/SCORECARD.md` | 1 |
| `evals/<skill>/CARD.md` (regenerated) | 1 |

Plus `products/skills-with-evals/receipts/g1-run-<stamp>.md`, the run summary. A full run is 186 runs and 186 trace
files. `node scripts/run-pack-lift.mjs --dry-run` prints the exact list.

## What "done" looks like

- The run ends with exit code 0 and a summary in which every row is comparable.
- `--check-outputs` prints `OK` for all 10 skills and `cards: every CARD.md is current`.
- Each card shows "Measured lift over the review cases (3 runs per arm)", the no-skill baseline, how often the skill
  fired on its job, and the stay-quiet result.

## If something goes wrong

| You see | Why | Do |
|---|---|---|
| `PREFLIGHT FAILED: not signed in` | No Claude login in this shell | `claude auth login`, choose the subscription |
| `PREFLIGHT FAILED: this would bill an API key` | `ANTHROPIC_API_KEY` is set, or the login is an API key | Remove the variable; sign in with the subscription |
| `Stopped early: … rate` or `… auth` | Plan limit or login expired mid-run | Wait, then `node scripts/run-pack-lift.mjs --skills <the ones not run>` |
| A row says `partial run (cost…)` | That skill hit its $5 cap | Leave it, or re-run that skill with a higher `--per-skill-usd` (your call) |
| `unexpected plugin(s)` or `the no-skill arm loaded the skill` | Something leaked into a run | Don't publish that skill's number; tell the agent |
| `claude is a .cmd shim … contains spaces` | Repo or TEMP path has spaces | Use the native `claude.exe`, or move the worktree |
| You stopped it with Ctrl-C | Interrupted runs can leave `claude-eval-*` folders in your temp folder | Delete them; a finished run removes its own |

Never edit a result, trace or card by hand. The cards refuse a result whose skill or tests changed after the run.
