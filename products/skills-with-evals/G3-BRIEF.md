# G3 brief: independent check of "Skills that ship with their evals" RC1

**For:** a Gemini-family model in a fresh thread with no prior context on this project.
**Why you:** the pack, its suites and its receipts were built by Claude-family agents. Estate doctrine
(`CROSS-MODEL-GATE.md`, `PRODUCT-RELEASE-GATE.md` G3) requires that a different provider check the
evidence cold. You are that check. You did not build any of this and owe it nothing.

## Ground rules

- **Read-only.** Do not push, comment, open issues or edit files. Your output is a report to Frank.
- **No paid runs.** Do not run `claude plugin eval` or anything else that bills a model. Reading files,
  running `node --test`, `node scripts/trigger-lint.mjs` and `node scripts/install-test.mjs` is fine:
  they call no model.
- **Cite or say unknown.** Every finding names a file and line (or a URL and the date you read it). If you
  cannot verify something, write "unverified" and say why. Do not fill gaps with what is usually true.
- **Name yourself.** Your report starts with your exact model name and the UTC date.

## What you are checking

- Repository: https://github.com/frankxai/claude-skills-library (public)
- Pull request: #82, branch `agent/hyperagent/eval-pack-rc1`, stacked on #33 (`agent/claude/skill-eval-pilot`).
  Record the head SHA you review: `git ls-remote https://github.com/frankxai/claude-skills-library refs/heads/agent/hyperagent/eval-pack-rc1`.
- Product claim being tested: *every skill in the pack ships with an eval suite, a no-skill baseline, a
  trigger test, and a measured lift.* RC1 claims the first three exist and says plainly that **lift has
  not been measured yet**. Hold it to exactly that.
- Evidence to review: the PR description, the **G0 claims table** and **G2 install report** posted as PR
  comments, `products/skills-with-evals/` (README, pack.json, this brief), `evals/<skill>/` for the ten
  skills in `pack.json`, and `scripts/eval-skill.mjs`, `scripts/trigger-lint.mjs`, `scripts/install-test.mjs`,
  `scripts/eval-card.mjs`, `scripts/tests/`.

## Questions to answer

1. **Claims.** For each row of the G0 claims table, open the evidence. Mark it *backed*, *overstated*
   (true but worded stronger than the evidence) or *unbacked*. One unbacked claim on a public surface is a
   FAIL under `PRODUCT-RELEASE-GATE.md` G0.
2. **Recall cases are fair.** For each skill's `seeded-defects/`: is every defect in `KEY.md` actually
   present in the fixture under `resources/`? Is each one a real defect a senior reviewer would block
   on, not a style preference? Is there an *unkeyed* serious defect in the fixture that a good review
   would report and the graders would not reward? Does the prompt hint at the answers?
3. **Precision cases are fair.** For each `clean*/` case: does the fixture really fix every keyed defect,
   without leaving one behind? Would `graders/no-unsupported-claims.md` punish a reviewer for a
   *correct* minor suggestion? It should not; it should punish invented or contradicted defects.
4. **Graders are decidable.** Can an LLM judge decide each grader from the final answer alone, without
   guessing? Flag any criterion that needs facts the judge does not have.
5. **No-trigger cases are honest.** Is each no-trigger prompt adjacent enough to tempt the skill but
   genuinely outside its job? Is any of them so far away that passing it proves nothing?
6. **No leakage.** Confirm from `scripts/eval-skill.mjs` and its tests that `KEY.md`, graders and old
   results are never staged into the plugin the model sees.
7. **Lift would be valid.** Read `comparability()` in `scripts/eval-skill.mjs` and `scripts/eval-card.mjs`.
   Would they refuse to show a lift when arms are unequal, runs errored, the judge was skipped or the run
   was partial? What is still weak? (The judge is from the same provider as the model under test; say how
   much that matters for these graders.)
8. **Trigger lint is right.** Spot-check five skills: is the reported character position of the
   "use when" cue correct, and is the ~100-character Codex window claim consistent with the PR's evidence?
9. **Install.** If you have a shell with `claude` and `codex`, run `node scripts/install-test.mjs` from a
   fresh clone and compare with the G2 report. If you do not, say so and judge the G2 report on its own.
10. **Market bar.** If `BAR.md` exists in the starlight-estate PR or is quoted in the PR thread, check that
    each competitor URL, price and date is real on the day you look. Mark any you cannot open.

## Output (use exactly this shape)

```
Checker: <exact model name>   Date (UTC): <yyyy-mm-dd>   Head SHA reviewed: <sha>
Verdict: PASS | ITERATE | FAIL | NEEDS-HUMAN      (release-gate wording: PASS | REVISE | FAIL)
Confidence: low | medium | high, with one sentence on why

Evidence: the five to ten files and lines that decided the verdict

Claims table audit: one line per G0 row: backed | overstated | unbacked, and why

Per-skill suite review (10 rows):
| skill | recall fixture fair? | clean twin fair? | graders decidable? | no-trigger honest? | defects |

Blocking gaps: P0 (outcome unreachable or a public claim unbacked), P1 (works with friction or overstated)
Non-blocking: P2

Next action: the smallest change that would move the verdict up one level
What would change my mind: the evidence that would flip the verdict
```

A disagreement between your verdict and the maker's is resolved by Claude Opus, per
`CROSS-MODEL-GATE.md`. Write your report for that judge as well as for Frank.
