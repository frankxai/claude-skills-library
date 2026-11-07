# Spec: verdict-store

Module id `verdict-store` · spec-driven development Phase 1 · status: existing, to be hardened.

## Objective

One machine-readable home for eval verdicts, consumed by the skills graph and the catalog. It
exists today at `starlight/ops/skill-eval-verdicts.json` (updated 2026-10-25: 30 PASS, 0 REVISE,
0 FAIL, planted faults 90/90). The job of this module is to keep that file trustworthy: a verdict
must name the exact `SKILL.md` revision it covers and point at a run receipt.

## Tech stack

Node 20+, JSON on disk, no database. Schema owned by this spec, consumed by
`tools/gen-skills-graph.mjs` and `tools/eval-skills-suite.mjs`.

## Commands

```text
node starlight/tools/eval-skills-suite.mjs              # regenerate verdicts + receipts
node starlight/tools/gen-skills-graph.mjs               # exit 0; counts.withEval must match
node scripts/eval-pack-scoreboard.mjs --estate-root C:/Users/frank/starlight
Get-Content starlight/ops/skill-eval-verdicts.json
```

## Project structure

```text
starlight/ops/skill-eval-verdicts.json            # the registry (control plane)
starlight/queen/reports/skill-eval-receipts-<date>.json
starlight/queen/reports/skill-eval-receipts-<date>.md
docs/products/claude-skills-eval-pack/SPEC-verdict-store.md
```

## Code style

One verdict object, no nullable verdict, no prose where a field belongs:

```json
{
  "verdict": "PASS",
  "evaluatedAt": "2026-10-25",
  "deterministicPass": true,
  "plantedFaultsCaught": "3/3",
  "receipt": "queen/reports/skill-eval-receipts-2026-10-25.json#agent-design-review"
}
```

Naming: kebab-case skill ids, ISO dates, `passed/revise/failed` counts at the top level, and a
`receipt` path per skill. A missing receipt is a FAIL, not a pass with a note.

## Testing strategy

- Deterministic: parse the file, assert `passed + revise + failed` equals the number of skill
  entries, every `PASS` has a `receipt` pointing at an existing file, and every `evaluatedAt` is
  not older than the owner `SKILL.md` mtime in `graph/skills.graph.json`.
- Integration: `gen-skills-graph.mjs` must report `withEval` equal to the registry's `passed`.
- Planted fault: insert a verdict with no receipt, run the checks, assert exit 1.

## Boundaries

- Always: regenerate from `eval-skills-suite.mjs`, never hand-edit a verdict.
- Ask first: adding a top-level field (it changes the graph consumer).
- Never: store personal data, secrets, or an email in this file; write a verdict for a skill the
  resolver does not own; mark PASS from a text-only lint.

## Success criteria

`gen-skills-graph.mjs` exits 0; `counts.withEval` equals registry `passed`; every PASS has a
resolvable receipt; a planted missing-receipt fault fails the checks; the scoreboard reports G2
PASS and G3 PASS.

## Open questions

`[OPEN]` whether a verdict should expire after N days. Until decided, the staleness check compares
the receipt date with the `SKILL.md` mtime and reports, it does not auto-expire.
