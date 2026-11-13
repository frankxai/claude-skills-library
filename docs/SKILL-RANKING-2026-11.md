# Skill quality ranking, 2026-11

Author: Claude cloud routine, 2026-11-13. Branch `agent/claude/skill-ranking-2026-11`. Scope: every `SKILL.md` under `packs/` and `absorbed/` (47 files). `free-skills/` is out of scope except for the duplicate check.

## How the numbers were produced

| Number | Command | Result |
|---|---|---|
| Skill files | `find packs absorbed -name SKILL.md \| wc -l` | 47 |
| Lint, whole tree | `python3 scripts/validate_skills.py packs absorbed` | `OK: 47 skill file(s) and registries are spec-compliant.` 0 errors, 11 warnings |
| Lint, per skill | `python3 scripts/validate_skills.py <skill dir>` once per skill (script `inv.py`, scratch) | 47 of 47 exit 0; warning counts per skill in the table |
| Word count | `len(SKILL.md.split())` over the whole file including frontmatter | column `Words`; 43 of 47 under 2,500 |
| Trigger description | regex over frontmatter `description`: needs 40+ chars and a phrase such as `use when`, `use before`, `when the user`, `trigger` | 38 of 47 pass (see definition note) |
| Has examples | `SKILL.md` has an `Example` heading, `<example` tag or an `examples/` dir | 5 of 47 |
| eval suite exists | `evals/<skill>/` dir under the pack | 10 of 47 (all in `skills-with-evals`) |
| Eval pass | see next section | 0 of 47 passing |
| Repo tests | `node --test` | tests 408, pass 403, fail 0, skipped 5 |
| Absorbed harness gate | `node absorbed/harness/eval-estate.mjs` | `EVAL PASS skills=8` (marker-text check, not scored) |
| Other gates | `check_links.py`, `generate_catalog.py --check`, `check_counts.py` | all OK (396 md files; 116 skills) |

Definitions are mine, not the repo's. The trigger and example checks are text heuristics; a skill can pass them and still trigger badly.

## Eval suites: what ran

**Not run: all 10 suites in `packs/skills-with-evals/evals/`.** They run via `claude plugin eval`, which calls a model under test plus a paid judge (the pack's own RESULTS.md records 13.22 USD for one partial run). `ANTHROPIC_API_KEY` is not set here (`env | grep -c ANTHROPIC_API_KEY` printed 0) and this routine has no spend authorisation. `claude plugin eval --help` works, but `claude plugin eval . --dry-run` fails with `error: unknown option '--dry-run'`, so there is no free way to execute a case, and I did not run the paid form.

The only recorded result is the 2026-10-06 run in `packs/skills-with-evals/results/2026-10-06`, produced by someone else. I re-rendered it with `node packs/skills-with-evals/scripts/summarize.mjs packs/skills-with-evals/results/2026-10-06`: 8 skills reported, 7 FAIL and 1 NOT RUN (model-routing); todo-discipline and verification-quality are absent from it. Zero pass. Four failures were case-design faults, and cases for feynman-thinking and loop-designer were edited afterwards without a rerun (RESULTS.md follow-up 2026-11-03). Because no suite is both present and passing, the 40-point eval criterion scores 0 for every skill. That is a floor, not a verdict.

## Score

Eval present **and passing** 40, lint pass 25, trigger description 15, size under 2,500 words 10, has examples 10. Maximum reachable today is 60. Ties break by fewer lint warnings, then name.

## Ranked table

| # | Pack | Skill | Score | evals/ | Eval passing | Lint | Warn | Trigger | Words | Examples |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | web-excellence | animation-vocabulary | 60 | no | no (not run) | yes | 0 | yes | 2,159 | yes |
| 2 | web-excellence | ui-ux-pro-max | 60 | no | no (not run) | yes | 0 | yes | 1,765 | yes |
| 3 | skills-with-evals | langgraph-patterns | 60 | yes | no (not run) | yes | 1 | yes | 787 | yes |
| 4 | skills-with-evals | mcp-architecture | 60 | yes | no (not run) | yes | 1 | yes | 1,137 | yes |
| 5 | absorbed/harness | agent-harness-construction | 50 | no | no (not run) | yes | 0 | yes | 236 | no |
| 6 | absorbed/harness | context-budget | 50 | no | no (not run) | yes | 0 | yes | 290 | no |
| 7 | web-excellence | core-web-vitals | 50 | no | no (not run) | yes | 0 | yes | 725 | no |
| 8 | absorbed/harness | cost-aware-llm-pipeline | 50 | no | no (not run) | yes | 0 | yes | 265 | no |
| 9 | absorbed/engineering | diagnosing-bugs | 50 | no | no (not run) | yes | 0 | yes | 873 | no |
| 10 | absorbed/engineering | doubt-driven-development | 50 | no | no (not run) | yes | 0 | yes | 799 | no |
| 11 | estate-guard | estate-guard | 50 | no | no (not run) | yes | 0 | yes | 865 | no |
| 12 | skills-with-evals | feynman-thinking | 50 | yes | no (not run) | yes | 0 | yes | 524 | no |
| 13 | film-excellence | film-release-gate | 50 | no | no (not run) | yes | 0 | yes | 729 | no |
| 14 | web-excellence | find-animation-opportunities | 50 | no | no (not run) | yes | 0 | yes | 1,430 | no |
| 15 | web-excellence | gpu-surface | 50 | no | no (not run) | yes | 0 | yes | 1,325 | no |
| 16 | skills-with-evals | hooks-automation | 50 | yes | no (not run) | yes | 0 | yes | 901 | no |
| 17 | web-excellence | improve-animations | 50 | no | no (not run) | yes | 0 | yes | 1,206 | no |
| 18 | skills-with-evals | loop-designer | 50 | yes | no (not run) | yes | 0 | yes | 1,395 | no |
| 19 | starlight-neutron | neutron | 50 | no | no (not run) | yes | 0 | yes | 1,004 | no |
| 20 | starlight-neutron | neutron-log | 50 | no | no (not run) | yes | 0 | yes | 704 | no |
| 21 | stack-kits | nextjs | 50 | no | no (not run) | yes | 0 | yes | 1,309 | no |
| 22 | stack-kits | react | 50 | no | no (not run) | yes | 0 | yes | 1,309 | no |
| 23 | routine-contract | routine-contract | 50 | no | no (not run) | yes | 0 | yes | 901 | no |
| 24 | absorbed/harness | santa-method | 50 | no | no (not run) | yes | 0 | yes | 294 | no |
| 25 | absorbed/harness | search-first | 50 | no | no (not run) | yes | 0 | yes | 306 | no |
| 26 | absorbed/harness | security-review | 50 | no | no (not run) | yes | 0 | yes | 277 | no |
| 27 | absorbed/engineering | source-driven-development | 50 | no | no (not run) | yes | 0 | yes | 621 | no |
| 28 | absorbed/harness | strategic-compact | 50 | no | no (not run) | yes | 0 | yes | 285 | no |
| 29 | stack-kits | tailwindcss | 50 | no | no (not run) | yes | 0 | yes | 956 | no |
| 30 | absorbed/engineering | to-spec | 50 | no | no (not run) | yes | 0 | yes | 485 | no |
| 31 | absorbed/harness | verification-loop | 50 | no | no (not run) | yes | 0 | yes | 520 | no |
| 32 | web-excellence | visual-proof | 50 | no | no (not run) | yes | 0 | yes | 652 | no |
| 33 | web-excellence | web-design-guidelines | 50 | no | no (not run) | yes | 0 | yes | 176 | no |
| 34 | web-excellence | web-release-gate | 50 | no | no (not run) | yes | 0 | yes | 1,182 | no |
| 35 | web-excellence | web-steward | 50 | no | no (not run) | yes | 0 | yes | 922 | no |
| 36 | skills-with-evals | agentic-orchestration | 50 | yes | no (not run) | yes | 1 | yes | 856 | no |
| 37 | skills-with-evals | ai-architect-review | 50 | yes | no (not run) | yes | 1 | yes | 1,975 | no |
| 38 | skills-with-evals | model-routing | 50 | yes | no (not run) | yes | 1 | yes | 1,138 | no |
| 39 | stack-kits | shadcn | 50 | no | no (not run) | yes | 1 | yes | 1,184 | no |
| 40 | skills-with-evals | todo-discipline | 50 | yes | no (not run) | yes | 1 | yes | 103 | no |
| 41 | skills-with-evals | verification-quality | 50 | yes | no (not run) | yes | 1 | yes | 570 | no |
| 42 | web-excellence | apple-design | 40 | no | no (not run) | yes | 0 | yes | 3,426 | no |
| 43 | web-excellence | extract-design-system | 35 | no | no (not run) | yes | 0 | no | 292 | no |
| 44 | web-excellence | review-animations | 35 | no | no (not run) | yes | 0 | no | 1,120 | no |
| 45 | web-excellence | image-to-code | 35 | no | no (not run) | yes | 1 | no | 5,820 | yes |
| 46 | web-excellence | brandkit | 25 | no | no (not run) | yes | 1 | no | 2,600 | no |
| 47 | web-excellence | emil-design-eng | 25 | no | no (not run) | yes | 1 | no | 3,877 | no |

## Top 10 to promote

Highest score. Because eval points are 0 for all, this ranks on hygiene only; it says a skill is well-formed, not that it works. Two caveats from the recorded eval: langgraph-patterns showed +0.42 delta but errored on 2 of 4 runs, and mcp-architecture showed no lift over baseline (1.00 vs 1.00).

1. `web-excellence/animation-vocabulary`: 60 (2,159 words, 0 lint warnings)
2. `web-excellence/ui-ux-pro-max`: 60 (1,765 words, 0 lint warnings)
3. `skills-with-evals/langgraph-patterns`: 60 (787 words, 1 lint warnings)
4. `skills-with-evals/mcp-architecture`: 60 (1,137 words, 1 lint warnings)
5. `absorbed/harness/agent-harness-construction`: 50 (236 words, 0 lint warnings)
6. `absorbed/harness/context-budget`: 50 (290 words, 0 lint warnings)
7. `web-excellence/core-web-vitals`: 50 (725 words, 0 lint warnings)
8. `absorbed/harness/cost-aware-llm-pipeline`: 50 (265 words, 0 lint warnings)
9. `absorbed/engineering/diagnosing-bugs`: 50 (873 words, 0 lint warnings)
10. `absorbed/engineering/doubt-driven-development`: 50 (799 words, 0 lint warnings)

## Bottom 10 and the concrete fix each needs

| # | Skill | Score | Fix |
|---|---|---|---|
| 38 | skills-with-evals/model-routing | 50 | move non-spec frontmatter keys under `metadata` (validate_skills.py warning) |
| 39 | stack-kits/shadcn | 50 | add `evals/<skill>/{outcome-a,outcome-b,no-trigger}/case.yaml` (pattern: packs/skills-with-evals/evals); move non-spec frontmatter keys under `metadata` (validate_skills.py warning) |
| 40 | skills-with-evals/todo-discipline | 50 | move non-spec frontmatter keys under `metadata` (validate_skills.py warning) |
| 41 | skills-with-evals/verification-quality | 50 | move non-spec frontmatter keys under `metadata` (validate_skills.py warning) |
| 42 | web-excellence/apple-design | 40 | split 3,426-word body; move depth into `references/`; add `evals/<skill>/{outcome-a,outcome-b,no-trigger}/case.yaml` (pattern: packs/skills-with-evals/evals) |
| 43 | web-excellence/extract-design-system | 35 | rewrite `description` to say when to use it (add a 'Use when ...' sentence); add `evals/<skill>/{outcome-a,outcome-b,no-trigger}/case.yaml` (pattern: packs/skills-with-evals/evals) |
| 44 | web-excellence/review-animations | 35 | rewrite `description` to say when to use it (add a 'Use when ...' sentence); add `evals/<skill>/{outcome-a,outcome-b,no-trigger}/case.yaml` (pattern: packs/skills-with-evals/evals); note: `disable-model-invocation: true`, so a trigger description matters less; still add a one-line use case |
| 45 | web-excellence/image-to-code | 35 | rewrite `description` to say when to use it (add a 'Use when ...' sentence); split 5,820-word body; move depth into `references/`; add `evals/<skill>/{outcome-a,outcome-b,no-trigger}/case.yaml` (pattern: packs/skills-with-evals/evals); move non-spec frontmatter keys under `metadata` (validate_skills.py warning) |
| 46 | web-excellence/brandkit | 25 | rewrite `description` to say when to use it (add a 'Use when ...' sentence); split 2,600-word body; move depth into `references/`; add `evals/<skill>/{outcome-a,outcome-b,no-trigger}/case.yaml` (pattern: packs/skills-with-evals/evals); move non-spec frontmatter keys under `metadata` (validate_skills.py warning) |
| 47 | web-excellence/emil-design-eng | 25 | rewrite `description` to say when to use it (add a 'Use when ...' sentence); split 3,877-word body; move depth into `references/`; add `evals/<skill>/{outcome-a,outcome-b,no-trigger}/case.yaml` (pattern: packs/skills-with-evals/evals); move non-spec frontmatter keys under `metadata` (validate_skills.py warning) |

## Duplicates and overlaps

All found by `find free-skills -type d -name <name>` and `diff`; line counts are `diff <pack copy> <free-skills copy> \| wc -l` (includes frontmatter shape changes).

- **Ten pack skills also exist as `free-skills/` copies** (every skill in `packs/skills-with-evals`): the same directory names. Near-identical (5-9 diff lines, mostly frontmatter `version`/`author` moved under `metadata`): ai-architect-review (5), langgraph-patterns (5), mcp-architecture (5), todo-discipline (7), verification-quality (9). Diverged: model-routing (18), feynman-thinking (57), loop-designer (91), hooks-automation (374), agentic-orchestration (382). Two copies means evals on the pack version say nothing about the free version. Pick one source of truth.
- `agentic-orchestration` and `mcp-architecture` exist a third time under `free-skills/technical/`.
- `loop-designer` sits beside `free-skills/loop-orchestrator` and `free-skills/loop-runner`; names suggest overlap. Not diffed.
- `packs/stack-kits/skills/nextjs` and `react` have identical word counts (1,309) and differ by 871 diff lines total in the body, so they share a large template. Also overlap `free-skills/nextjs-expert`, `nextjs-react-expert`, `tailwind`. Not diffed against those.
- `absorbed/harness/verification-loop` and `skills-with-evals/verification-quality` both cover pre-merge verification; verification-loop is estate-specific (pnpm/uv, Windows), so keep both but cross-link.
- `web-excellence` has seven animation skills (animation-vocabulary, find-animation-opportunities, improve-animations, review-animations, emil-design-eng, gpu-surface, plus `free-skills/css-animations`); emil-design-eng and review-animations both derive from the same Emil Kowalski philosophy.

## Not done

- No eval was executed (see above). Passing-eval points are therefore unearned for everyone.
- `free-skills/` was not ranked. The overlap notes marked 'not diffed' are untested guesses from names.
