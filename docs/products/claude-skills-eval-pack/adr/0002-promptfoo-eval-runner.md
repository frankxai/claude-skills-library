# ADR-0002: Promptfoo with deterministic assertions first

**Date**: 2026-11-07
**Status**: proposed (the deterministic and planted-fault layers already run; the agent layer does not)
**Deciders**: OpenCode, on Frank's "lead decide" directive. Frank still rules on any paid provider spend.

## Context

The product's whole claim is that a skill behaves under pressure. A lint of `SKILL.md` proves the
file is well formed, not that an agent used the skill or did better work because of it. Promptfoo's
"Test Agent Skills" guide (opened 2026-11-07) supplies `skill-used`, `not-skill-used`, deterministic
JavaScript assertions, `--repeat 3` and `-o results.json`, and shows the same suite running against
Claude, Codex and OpenCode providers.

## Decision

Use `npx promptfoo@latest eval -c evals/promptfoo.yaml --repeat 3 --no-cache -o evals/results.json --no-share`.
Order assertions cheapest-first: routing, then deterministic output checks, then graded rubrics
only if the first two cannot answer. Run two skill versions against identical fixtures; swap only
the `SKILL.md`. Keep `--no-share` so private results stay local.

### Alternatives considered

**Only the existing deterministic suite (`tools/eval-skills-suite.mjs`)**
- Pros: free, local, already 90/90 on planted faults, no provider cost.
- Cons: cannot prove an agent used the skill or that its work improved.
- Why not: keep it as the first layer, not the whole verdict. It stays authoritative for G1.

**A custom Node harness**
- Pros: no dependency, full control of exit codes.
- Cons: re-implements providers, graders and CI output that Promptfoo already ships; maintenance
  lands on this estate.
- Why not: novelty is not quality (product-outcome-quality policy, 8 October 2026).

**Manual review of a skill in a real task**
- Pros: catches things no grader will.
- Cons: not reproducible, no dated receipt, does not scale past ten skills.
- Why not: it is a critique step, not a verdict. The craft receipt uses a different provider for
  that job.

## Consequences

### Positive
- One config runs on three harnesses; the receipt is a JSON file anyone can re-read.
- Failure cases become part of the shipped gift rather than an internal artefact.
- Cost and latency can be asserted per suite.

### Negative
- Agent runs are nondeterministic; `--repeat 3` triples the cost of those cases.
- A paid provider adds a spend gate Frank must rule on before it is used.

### Risks
- A grader that passes a planted defect rubber-stamps everything. Mitigation: keep the 90/90
  planted-fault suite as a gate; a grader that passes a planted fault fails the run.
- Model drift makes an old receipt incomparable. Mitigation: record model, provider, settings and
  the exact `SKILL.md` revision in every receipt.
