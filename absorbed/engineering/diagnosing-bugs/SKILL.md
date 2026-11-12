---
name: diagnosing-bugs
description: "Find the cause of a hard bug, outage or slowdown by building a red-capable feedback loop before forming any theory. Use when something is broken, failing, flaky, slow or keeps recurring, including machine-level problems such as lost logins, restarts or a gate that fails open."
license: MIT
---

# Diagnosing bugs

The whole skill is one discipline: get a command that goes red on this exact bug before you reason about causes. With that command, bisecting, testing hypotheses and verifying the fix are mechanical. Without it, reading code produces confident wrong answers, and the estate has a long record of gates that "worked" until someone tested them.

## Redact first

Commands, logs and captured requests carry tokens and account names. Replace secrets with `<REDACTED>`, keep credentials in environment variables or Infisical, and quote only the lines that carry the signal. The secret guard will block a tool call that leaks one; do not route around it.

## 1. Build the loop (spend most of the effort here)

Pick the first that reaches the bug:

1. A failing test at the seam that hits it (`pnpm test -- <name>`, `uv run pytest -k <name>`, `node --test <file>`).
2. A `curl` or HTTP script against a running dev server or a preview URL.
3. A CLI run on a fixture, diffed against a known-good output.
4. A headless browser script through the shared `browse` Chromium or BrowserOS, asserting on DOM, console or network.
5. A replayed capture: save the real request, event or payload to disk and push it through the code path alone.
6. A minimal harness: one service, mocked dependencies, one call.
7. A property or fuzz loop for "sometimes wrong".
8. A bisection script for "worked at X, broken at Y" (`git bisect run <script>`).
9. A differential run: same input through old and new, diff the outputs.
10. For machine state, an event-log or file-state probe: Windows event logs (`Get-WinEvent` on the right channel), file timestamps, SQLite row counts read with `immutable=1`. These are loops too, and often the only honest ones.

Tighten it: faster setup, an assertion on the exact symptom rather than "did not crash", pinned time, seeds and network. For flaky bugs the goal is a higher reproduction rate, not a clean repro: loop the trigger, add stress, narrow timing.

Machine notes: there is no WSL here, so loops that shell out to `bash` fail for reasons unrelated to the bug; prefer `node` or `pwsh`. Run `pp preflight` before heavy loops and respect the 4 GiB RAM floor. Probes that touch browsers or credential stores belong in a script file, and must stay read-only.

If no loop is possible, stop and say so. List what you tried and ask for access, a redacted capture (HAR, log dump, recording with timestamps) or permission for temporary instrumentation. Do not move to theories.

**Exit criterion:** one command you have already run, shown with its redacted output, that drives the real code path, asserts the user's exact symptom, gives the same verdict each run, finishes in seconds and runs unattended.

## 2. Reproduce and shrink

Run the loop and watch it go red on the symptom the user described, not a neighbouring failure. Then cut inputs, callers, config and steps one at a time, re-running after each cut, until every remaining piece is load-bearing.

## 3. Hypothesise

Write three to five ranked, falsifiable hypotheses before testing any: "if X is the cause, changing Y makes it disappear." A hypothesis without a prediction is a mood. Show the list to the user if they are around; do not wait if they are not.

## 4. Instrument

Each probe answers one prediction; change one variable at a time. Prefer a debugger or REPL, then targeted logs at the boundaries that separate hypotheses. Tag every temporary log with a unique prefix such as `[DEBUG-a4f2]` so cleanup is one search. For performance, measure a baseline first, then bisect; logs mislead on speed.

## 5. Fix with a regression test

Write the failing test before the fix, but only at a seam that reproduces the real call pattern. If no such seam exists, that is a finding: record it rather than adding a shallow test that proves nothing. Watch the test fail, apply the fix, watch it pass, then re-run the original loop on the un-shrunk scenario.

## 6. Clean up and record

- [ ] The original loop no longer goes red.
- [ ] The regression test passes, or the missing seam is written down.
- [ ] Every `[DEBUG-` line is gone.
- [ ] Throwaway harnesses are deleted or clearly parked.
- [ ] The confirmed cause and the evidence are in the PR or handover, tagged `[MEASURED <method> <date>]`. If the cause is systemic (it will recur), add a memory note so the next session starts from it.

## Where this came from

The loop-first discipline, the ten ways to build a loop, the shrink step, falsifiable ranked hypotheses, tagged debug logs and the seam rule follow mattpocock/skills `skills/engineering/diagnosing-bugs` at `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` (MIT). Event-log and file-state loops, the no-WSL and RAM-floor notes, the read-only probe rule, the secret guard and the MEASURED-tag record are estate rules.

Built on SIP.
