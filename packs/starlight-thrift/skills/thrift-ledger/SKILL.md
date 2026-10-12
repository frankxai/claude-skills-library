---
name: thrift-ledger
description: Measure whether a token-saving tool actually saves tokens and keeps answers correct. Use before adopting or recommending RTK, headroom, caveman or any compressor, after changing a hook or instruction file, and when someone quotes a savings percentage. Runs a same-task before and after protocol and records only measured numbers.
---

# Thrift ledger

A savings figure from a README is a claim. A figure from your own session is a result. This skill produces results.

## What counts as a result

A result needs all four:

1. **Same task, same repo, same starting commit** for the baseline and the candidate.
2. **Quality held.** The tests, checks or acceptance criteria that passed in the baseline pass in the candidate. A cheaper wrong answer is a loss.
3. **A named unit.** Bytes, estimated tokens, or billed tokens. Say which. RTK estimates tokens as bytes divided by four, so its percentages are reliable and its absolute token counts are not.
4. **A date and a machine.** Tool versions drift. Record them.

Anything else is written down as `unmeasured`.

## Fast check: command output

For shell-output compressors, compare raw and compressed output on real commands in a real repo:

```
node packs/starlight-thrift/scripts/thrift.mjs bench
node packs/starlight-thrift/scripts/thrift.mjs bench --json
```

This measures bytes only. It proves the filter shrinks the output. It does not prove the agent still has what it needs, so spot-check one compressed output by hand for each command class before trusting it.

## Full check: a session

1. Pick two or three tasks you actually do. A bug fix with a failing test, a repo-wide search and summary, a review of a medium diff.
2. Run each task twice from the same commit: once with the candidate off, once on. Use a fresh session each time.
3. Record, for each run: tokens in, tokens out, cache read and cache write if shown, tool-call count, wall time, and whether the acceptance check passed.
4. Read the sources:
   - `ccusage session` for per-session tokens and cost.
   - `rtk gain` for what RTK filtered, and `rtk gain --history` if you need per-command detail.
   - `headroom perf` for proxy-side savings, with the proxy running.
5. Compare. Report the delta per metric and the quality verdict side by side.

Three tasks is a sanity check, not a benchmark. Say so in the write-up.

## Record

Append one block per result to the pack's results log, or to the PR description:

```
date: 2026-10-12
machine: <name>
tool: rtk 0.50.0
task: <one line>
unit: bytes | est-tokens | billed-tokens
baseline: <number>
candidate: <number>
saved: <percent>
quality: pass | fail | not-checked
notes: <what was filtered, what was lost, surprises>
```

## Reference baseline (command output, bytes)

Measured 2026-10-12 on this repository with RTK 0.50.0, Windows 11, Git Bash. One repo, one machine, bytes not tokens.

| Command | Raw | RTK | Saved |
|---|---|---|---|
| `git log -n 40` | 52,767 | 10,065 | 80% |
| `git diff HEAD~5` | 99,882 | 27,221 | 72% |
| `ls -la .` | 1,842 | 321 | 82% |
| `find free-skills -maxdepth 3 -type f` | 12,261 | 1,331 | 89% |
| `grep -rn name: free-skills` | 28,229 | 15,179 | 46% |
| `git status` | 68 | 50 | 26% |
| file read, test-runner output on a passing run | unchanged | unchanged | 0% |

File reads and a passing validator run came out unchanged: the filters help where output is long and repetitive and do nothing where it is already small. Do not expect a flat percentage across a session.

## Failure modes to check for

- **Lost signal.** The filter dropped the one line that mattered. Re-run the failing case uncompressed once.
- **Double compression.** Two proxies or two hooks on the same stream. Run one input-side compressor at a time until a result shows stacking helps.
- **Cache breakage.** An instruction or tool change mid-session invalidated the cached prefix. Compare cache-read tokens before and after.
- **Savings that only exist on the benchmark.** A tool tuned on its own fixtures can underperform on your repos. Use your repos.
