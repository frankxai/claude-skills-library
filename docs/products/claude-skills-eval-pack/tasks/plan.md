# Implementation plan - claude-skills-eval-pack

Derived from [CAPABILITY-MAP.md](../CAPABILITY-MAP.md). Source of truth for module boundaries is
the map, never this file. Phase numbers come from [PHASES.md](../PHASES.md).

## Components and dependencies

```text
verdict-store ──> eval-runner ──> catalog ──> capture ──> publication
                       │              │           │            │
                       └──────────────┴───────────┴────────────┘  scoreboard reads all
```

`verdict-store` and the deterministic half of `eval-runner` already exist. `harness-surface` was
built on 2026-11-07 (manifest, generator, CLI, eight stubs). `catalog`, `capture` and
`publication` do not. The scoreboard is a read-only observer of all six.

## Implementation order

1. `verdict-store` hardening (staleness check, receipt resolution, planted-fault test).
2. `eval-runner` agent layer (Promptfoo configs, three-layer cases, revision in receipt).
3. `catalog` generated columns and honest `UNEVALUATED` state.
4. `harness-surface` (DONE 2026-11-07): one manifest, generated stubs, any-agent CLI.
5. `capture` two-step door and packaged gift.
6. `publication` versioning and gate receipts.

Steps 3, 4 and 5 can be built in parallel only after step 2's verdict contract is frozen; steps 3
and 5 share the catalog CTA path. Steps 1 and 2 are sequential. Step 6 waits on Frank.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Namespace conflict returns | `gen-skills-graph.mjs` exits 1; scoreboard G2 FAIL; stop Phase 1 |
| Verdict outlives the `SKILL.md` | compare `evaluatedAt` with owner mtime; report, never auto-trust |
| Catalog shows a badge with no receipt | `check_links.py` planted fault fails the build |
| Capture built with a bespoke form to look done | `report.mjs` must read a `DemandSignal` with `productId`; otherwise G4 stays BLOCKED |
| A paid provider silently enters the eval suite | spend is Frank's; deterministic and planted-fault layers stay free and local |
| Registry `listType` drift stays invisible | `tools/validate-products-graph.mjs` gains an enum check; tracked as T1 |

## Verification checkpoints

- After step 1: `node tools/gen-skills-graph.mjs` exits 0; `counts.withEval` equals registry `passed`.
- After step 2: one `results.json` per flagship skill, with model, settings and revision recorded.
- After step 3: `generate_catalog.py --check`, `generate_site.py --check`, `check_counts.py`,
  `check_links.py` all exit 0.
- After step 4: `packages/demand-capture/report.mjs` exits 0 and returns a `priceBand`.
- After step 5: `PRODUCT-RELEASE-GATE.md` G0–G5 receipts dated; `npm view <pkg> version` matches.
- At every boundary: `node scripts/eval-pack-scoreboard.mjs --estate-root <starlight-root>`.

## Out of scope

No new repo, site, domain, brand, database, hosted API, checkout, price or external send. None of
those is needed to prove the product's claim, and each carries its own gate.

## Review gate

This plan follows the approved spec. A change to module boundaries goes back to the capability map
first; a change to a technical choice goes to an ADR; a change to a task goes to
[todo.md](todo.md).
