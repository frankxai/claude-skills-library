# Craft receipt: claude-skills-eval-pack, 2026-10-21

maker: Claude Opus 5.5 (Claude Code, Anthropic)
surface: github.com/frankxai/claude-skills-library, draft PR #33, branch agent/claude/skill-eval-pilot
author: Claude Opus 5.5 · created 2026-10-21 · revision 1 · review state: cross-provider reviewed (Codex), no measured run yet
scope: lift suites for book-publishing and excellence-book-writing, and the label-and-SHA-gated CI lift job for those two plus ui-ux-design-expert

## Research
- https://github.com/frankxai/claude-skills-library/graphs/traffic — read 2026-10-21 via `gh api .../traffic` — 959 views / 573 uniques in 14 days; the three most-read skill pages are ui-ux-design-expert (21 / 16), book-publishing (12 / 8) and excellence-book-writing (9 / 4). Small numbers: per-skill traffic picks the order, it does not prove demand.
- https://github.com/anthropics/skills — read 2026-10-21 via `gh api .../git/trees/main?recursive=1` — 20 `SKILL.md` files; the only `evals` paths belong to the claude-api skill's teaching material, so none of those skills ships a with/without-skill result. This is the free reference a buyer already has.
- https://code.claude.com/docs/en/plugin-evals.md — read 2026-10-21 — the official two-arm runner: score is the weighted share of graders passed, delta is with minus without, and `tool_used` graders on `Skill` are report-only in a two-arm run. The suites are built to that contract.
- https://pubmed.ncbi.nlm.nih.gov/19144931/ — read 2026-10-21 via the Europe PMC API — Haynes et al., NEJM 2009: 19 items, eight hospitals, October 2007 to September 2008, 3,733 then 3,955 patients, deaths 1.5% to 0.8%, inpatient complications 11.0% to 7.0%. Used to correct the writing fixtures.
- https://doi.org/10.1002/ejsp.674 — read 2026-10-21 via the Crossref API — Lally et al. 2010: 96 volunteers, 12 weeks, modelled time to automaticity 18 to 254 days, one missed day did not materially matter. The median of 66 days is from the paper body, not the abstract.
buyer: someone already running agent skills daily who has been burned by a skill that read well and behaved badly (the registry row's buyer). What they use today is free skill lists with no evidence; it costs them a wasted afternoon per bad skill.

## Bar
- the 103 free skills in this same repo — not-beat — on evidence: three skills now carry two-arm suites, but none has a comparable measured run yet.
- awesome-claude-prompts and every other unevaluated skill list — not-beat — on evidence: the suites are a structural lead (baseline arm, seeded recall cases, clean precision cases, sealed answer keys), but a lead in structure with no result is not a buyer-visible win.
- writing the skill yourself in an afternoon — not-beat — on proof of lift: until a run shows the skill beats the no-skill baseline, the afternoon is still the rational choice.

## Refinement
Second pass (three rounds of fixes after cross-provider critique), `git diff --stat d9b7ee8 e6ce9fd`: 15 files changed, 69 insertions(+), 36 deletions(-).
what was cut: two unplanted claims that blurred the seeded cases, one causal overstatement in a clean fixture, a wrong study date and outcome label in four files, and a CI path that could go green after every eval failed.

## Critique
critic: OpenAI gpt-6-sol via `codex --profile review` (four passes, read-only, prompted as a skeptical reviewer)
verdict: pass 1 failed all three (book-publishing, excellence-book-writing, lift job) with five P1s; pass 2 passed excellence-book-writing; pass 3 passed book-publishing; pass 4 passed the lift job. Final: `VERDICT book-publishing: PASS`, `VERDICT excellence-book-writing: PASS`, `VERDICT workflow lift job: PASS`. Would the buyer pay? Not yet: there is still no measured result, which is the whole product.
fixed: Haynes dates, outcome label and patient count corrected; Lally figures qualified; unplanted claims removed; d3, d4 and d8 graders made to accept every valid fix and only valid fixes; the lift job now fails on a missing token or any non-comparable result, skips forks, checks out and verifies the approved head SHA (repository variable `LIFT_APPROVED_SHA`), scopes the token to one step, pins actions to commit SHAs and runs in its own concurrency group.
declined: none outstanding. The pass-1 decline on SHA-pinning was overruled by the critic in pass 2 and then fixed.

## Measured run
Blocked, not faked. The local `claude` CLI reports `loggedIn: false` and `claude -p` fails with "OAuth session expired and could not be refreshed", so `node scripts/eval-skill.mjs <skill>` cannot run here. The repository already holds `CLAUDE_CODE_OAUTH_TOKEN` (set 2026-09-26), so the CI lift job can run once a human reviews the PR's current head (the last code change is `e6ce9fd`; this receipt's commit sits on top of it), runs `gh variable set LIFT_APPROVED_SHA -R frankxai/claude-skills-library --body "$(gh pr view 33 -R frankxai/claude-skills-library --json headRefOid -q .headRefOid)"`, and adds the `run-lift-eval` label to PR #33. Applying the label from this session was refused by the permission classifier, which is correct: it spends the plan behind that token. Either that, or `claude` signed in locally, unblocks the run.
