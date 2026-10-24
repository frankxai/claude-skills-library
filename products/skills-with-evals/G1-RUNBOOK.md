# G1 runbook: measure the pack on your own Claude Code

One command, on your Claude subscription, no API key. It runs every skill's tests twice (with the skill and with no
skill), keeps every unedited trace, stops at the cost caps, and regenerates the cards from the results.

**If it stops for any reason (crash, Ctrl-C, closed laptop, rate limit), run the same command again.** It continues
where it stopped: finished skills are skipped, and the cost ledger guarantees the $50 cap covers every attempt
together, so nothing is paid for twice.

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
node scripts/held-out.mjs check                   # nothing held out is in the public tree
git add evals products/skills-with-evals          # public only: summaries, cards, README, ledger and run receipt
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
# The private half (answer keys, graders, fixed twins). Keep it OUTSIDE the repo; never commit it here.
# Either unpack the tarball from the agent thread to ..\skills-with-evals-private, or rebuild it from history:
node scripts/held-out.mjs export --from 0ae110c --to ..\skills-with-evals-private
node scripts/held-out.mjs status                  # all 10 present
```

The tarball also carries the private tests (`tests/held-out.test.mjs`); a rebuild from history does not. With the
private half in place, `node --test scripts/tests/eval-skill.test.mjs` runs them too.

Needs Claude Code 2.1.269 or later (tested on 2.1.310), Node 22 or later, and a repo path without spaces.

## What it does

1. **Preflight**, which stops before any model call if you are not signed in, or if it would bill an API key.
2. For each of the 10 skills: stages the skill and its tests, runs `claude plugin eval` with a no-skill baseline arm,
   3 runs per case per arm, model `sonnet`, judge `haiku`.
3. **Caps:** $5 per skill, $50 in total (`--per-skill-usd`, `--total-usd`). A skill that hits its cap is marked not
   comparable and the run moves on. On a subscription these figures are the harness's own estimate counted against
   your plan, not a bill.
4. **Stops early** on a login or rate-limit failure. Resume by running the same command again.
5. **Keeps a cost ledger** in `products/skills-with-evals/receipts/g1-ledger.jsonl`. Before each skill runs, it writes
   down what that skill may spend; afterwards, what it reported. The $50 cap applies to everything in the ledger, across
   every attempt. If a run was killed before it wrote a result, that skill counts at its full cap; the cost is unknown,
   so it assumes the worst. A run that did write a result counts at its reported cost.
6. **Skips what is done.** A skill whose newest result is current (skill and tests unchanged), complete, comparable and
   has 3 runs per arm is not run again. A skill that stopped on its $5 cap is not retried at $5 (pass a higher
   `--per-skill-usd`, or `--retry-capped`). `--force` re-runs everything you name.
7. **One run at a time.** A lock file next to the ledger stops a second copy. A lock left by a killed run on the same
   machine is cleared automatically.
8. Reads every run's trace and marks a skill not comparable if anything besides the skill under test and Claude Code's
   built-ins loaded, or if the no-skill arm loaded the skill.
9. Regenerates every `CARD.md` and writes a run summary with the whole ledger in it.

## Expected output files

| Per skill | Count |
|---|---|
| Private: `<private>/results/<skill>/<stamp>.json` (the tool's result, with every grader verdict) | 1 |
| Private: `<private>/results/<skill>/<stamp>.report.html` (Claude Code's report: scores, prompts, grader verdicts) | 1 |
| Private: `<private>/results/<skill>/<stamp>/traces/<case>__<with or without>__<n>.jsonl` (unedited run traces) | 18 (skill-builder: 24) |
| Private: `<private>/results/<skill>/SCORECARD.md` | 1 |
| Public: `evals/<skill>/results/<stamp>.summary.json` (totals only) | 1 |
| `evals/<skill>/CARD.md` (regenerated) | 1 |

Plus `products/skills-with-evals/receipts/g1-run-<stamp>.md` (the run summary, one per attempt) and
`products/skills-with-evals/receipts/g1-ledger.jsonl` (the cost ledger, appended to by every attempt). A full run is 186 runs and 186 trace
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
| `Stopped early: … rate` or `… auth` | Plan limit or login expired mid-run | Wait, then run the same command again |
| A row says `partial run (cost…)` | That skill hit its $5 cap | Leave it, or re-run with a higher `--per-skill-usd` (your call); it is not retried at the same cap |
| `Stopped early: campaign cap $50.00 reached (ledger)` | Earlier attempts used the budget | Your call: raise `--total-usd`, or stop here |
| `ledger: reconciled interrupted run … counted at its $5.00 cap` | A run was killed before it wrote a result | Nothing to do; that skill is re-run if budget remains |
| `LEDGER LOCKED: another G1 run … holds` | A second copy is running | Wait for it, or close it |
| `LEDGER LOCKED: … left by <other machine>` | The repo folder is synced from another machine | Check nothing is running there, then add `--break-lock` |
| `unexpected plugin(s)` or `the no-skill arm loaded the skill` | Something leaked into a run | Don't publish that skill's number; tell the agent |
| `claude is a .cmd shim … contains spaces` | Repo or TEMP path has spaces | Use the native `claude.exe`, or move the worktree |
| You stopped it with Ctrl-C | Interrupted runs can leave `claude-eval-*` folders in your temp folder | Delete them, then run the same command again |

Never edit a result, trace, card or the ledger by hand. Never copy anything from the private half into this repo,
a PR comment or the buyer page: totals only. The cards refuse a result whose skill or tests changed after the run.
