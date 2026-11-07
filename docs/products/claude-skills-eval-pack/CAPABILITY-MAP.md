# Capability Map - claude-skills-eval-pack

Spec-driven development Phase 0. This request bundles five independently testable capabilities:
each has its own consumer and data, can be cut without rewriting the others, and carries its own
acceptance. Module ids are stable for the whole initiative. Specs, plans and tasks select work by
these ids, never by filename guessing.

| Module id | Responsibility | Consumer | Depends on |
|---|---|---|---|
| `verdict-store` | machine-readable eval verdicts and the graph integration | `eval-runner`, `catalog`, scoreboard | - |
| `eval-runner` | run suites against real agents, emit receipts with passes and failures | `verdict-store` | `verdict-store` contract |
| `catalog` | public per-skill proof surface built from graph + verdicts | human buyer, buyer's agent | `verdict-store`, `eval-runner` |
| `capture` | standard `DemandSignal` waitlist with price band and the gift | human buyer | `catalog` (CTA target) |
| `publication` | versioned installable pack and release receipts | installer (three harnesses) | `catalog`, `capture`, G5 |

Build order: `verdict-store` → `eval-runner` → `catalog` → `capture` → `publication`.

Dependency direction is one-way. `verdict-store` and `eval-runner` already exist in the estate
control plane (measured 2026-11-07); the first two steps are therefore hardening, not greenfield.
`capture` and `publication` are blocked by credentials and Frank's release gate respectively. No
module spec is written outside this map.

## Interface contracts at the boundaries

- `eval-runner` → `verdict-store`: one JSON object per skill with `verdict`, `evaluatedAt`,
  `deterministicPass`, `plantedFaultsCaught`, `receipt` (path to the run output). Shape is fixed
  by `ops/skill-eval-verdicts.json`, which `tools/gen-skills-graph.mjs` already consumes.
- `verdict-store` → `catalog`: `graph/skills.graph.json`, field `skills[].eval` plus
  `counts.withEval`. The catalog never parses raw run output.
- `catalog` → `capture`: the CTA writes `DemandSignal.productId = "claude-skills-eval-pack"` and
  `source` naming the catalog path. No bespoke form.
- `capture` → `publication`: aggregate `priceBand` counts only. Personal data stays in KV and
  Resend; it never enters git, a report or the pack.

## What is out of scope for every module

A hosted API, a new database, a new brand, a new repository, a checkout, a price change, and any
external send. Those are separate decisions with their own gates.

## Review gate

This map is the first reviewable unit. Its ten lines fix module boundaries, dependency direction
and build order before any module spec is written. A change to build order is a change to this
map first, then to `tasks/plan.md`.
