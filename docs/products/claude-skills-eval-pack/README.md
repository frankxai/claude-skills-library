# Skills that ship with their evals - product definition suite

Product id: `claude-skills-eval-pack` (registry row in `starlight/graph/products.graph.json`).
Owning repo: `frankxai/claude-skills-library`. Branch: `agent/opencode/eval-pack-definition-20261107`.
Authored by OpenCode on 2026-11-07. Status of this suite: **specification complete, implementation incomplete**.
It defines a product; it does not claim the product exists.

## What this is

The only public surface in the estate with measured traffic is this repo. Its README already asks
"Would you pay for a skill that proves it works?" and names the missing moat: evals. That is a
public ask, not a `DemandSignal` and not price evidence. This suite
turns that question into a buildable, measurable, gated product definition. Every number below
names the command that produced it and the date it ran. `[OPEN]` means unmeasured, never guessed.

## Index

| File | Job |
|---|---|
| [PRD.md](PRD.md) | the buyer, the job, evidence, goals/non-goals/anti-goals, requirements, gates |
| [CAPABILITY-MAP.md](CAPABILITY-MAP.md) | spec-driven-development Phase 0: six modules and their build order |
| [SPEC-verdict-store.md](SPEC-verdict-store.md) | module: the machine-readable verdict registry |
| [SPEC-eval-runner.md](SPEC-eval-runner.md) | module: the eval runner and its receipts |
| [SPEC-catalog.md](SPEC-catalog.md) | module: the public proof surface |
| [SPEC-capture.md](SPEC-capture.md) | module: standard `DemandSignal` capture |
| [SPEC-publication.md](SPEC-publication.md) | module: packaging and release, gated by Frank |
| [SPEC-harness-surface.md](SPEC-harness-surface.md) | module: one manifest, generated stubs, any-agent install plans |
| [HARNESS-COVERAGE.md](HARNESS-COVERAGE.md) | measured harness and repo inventory, including the five config-repo gaps |
| [GOALS.md](GOALS.md) | ranked goals, success metrics, stop conditions, provenance of each metric |
| [PHASES.md](PHASES.md) | phases with done-conditions, verification commands and gates |
| [DESIGN-EXPECTATIONS.md](DESIGN-EXPECTATIONS.md) | research log, reference lock status, craft/accessibility/intelligence bar |
| [adr/README.md](adr/README.md) | decision index |
| [tasks/plan.md](tasks/plan.md) · [tasks/todo.md](tasks/todo.md) | implementation plan and task list |
| [CRAFT-RECEIPT.md](CRAFT-RECEIPT.md) | four-block craft receipt, validated by `tools/craft-receipt.mjs` |
| [scoreboard.latest.json](scoreboard.latest.json) | generated evidence, produced by the scoreboard tool |

## Run the tracker

```text
node scripts/eval-pack-scoreboard.mjs --estate-root <starlight-root>
node scripts/eval-pack-scoreboard.mjs --estate-root <starlight-root> --strict
node scripts/install-any-agent.mjs --all --verify
node scripts/gen-harness-adapters.mjs --check
```

The first prints the goal table and writes `scoreboard.latest.json`. The second exits 1 on any
FAIL so CI can gate a phase. Both are read-only against the estate control plane and write only
inside this product's docs directory. `<starlight-root>` is the directory containing
`graph/skills.graph.json`; omit the flag and the tool walks up from `scripts/` to find it.

## Authoritative sources

Product doctrine: `starlight/TRUTH.md` → `starlight/AGENTS.md` §5b, §5c, §11, §12, §13 →
`starlight/PRODUCT-RELEASE-GATE.md` → `starlight/DEMAND-CAPTURE-STANDARD.md`. Registry row first
(§5c.1): the row exists and is referenced, not duplicated. Receipts under `starlight/queen/reports/`
are evidence, never rules.

## Gates that still belong to Frank

Money (price, checkout, Polar token), first-time publication, repo visibility, DNS, secrets
(KV/Resend credentials), and the harvest run on over-budget PR queues. Nothing in this suite
opens a checkout, publishes a package, sends mail or changes a price.
