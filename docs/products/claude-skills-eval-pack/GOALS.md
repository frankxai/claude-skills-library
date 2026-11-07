# Goals and success metrics - claude-skills-eval-pack

Ranked against `starlight/OBJECTIVES.md` v2.0. Current values were produced by command on
2026-11-07 unless the date column says otherwise. Targets are decisions, not measurements.
`[OPEN]` means unmeasured and is never filled with a plausible guess.

## The one metric

North-star = shipped artifacts ÷ provider-% burned, target ≥5 clickable artifacts per 10% burn.
**Status: `[OPEN]`.** The artifact half is measurable (installable packs, published receipts); the
provider-% half needs the cost collector's current output. Until it runs, no claim about the ratio.

| # | Goal | Metric | Current | Target | Generator command | Status |
|---|---|---|---|---|---|---|
| G1 | Proof on every listing | skills with an eval verdict ÷ unique names | 30 ÷ 606 = 4.95% | ≥10% and all top-10 traffic skills | `node scripts/eval-pack-scoreboard.mjs --estate-root <starlight-root>` | FAIL |
| G2 | Namespace is unambiguous | unresolved conflicts | 0 | 0 (hard gate) | `node tools/gen-skills-graph.mjs` | PASS |
| G3 | The grader refuses rubber stamps | planted faults caught | 90/90 | 100% of planted faults caught | `Get-Content ops/skill-eval-verdicts.json` | PASS (measured 2026-10-25) |
| G4 | Real demand evidence | `DemandSignal` rows with `priceBand` for this product | `[OPEN]` - `report.mjs` exit 1 | ≥1 real row; ≥50 with a band before the founding milestone is honoured | `node packages/demand-capture/report.mjs` | BLOCKED (KV credentials) |
| G5 | Audience on the measured channel | uniques in the 14-day API window | 721 | 1,000 in the API window | `gh api repos/frankxai/claude-skills-library/traffic/views` | BEHIND |
| G6 | One installable, versioned pack | `npm view` / plugin listing for the pack | `[OPEN]` - no pack published | installable on Claude Code, Codex, OpenCode with version equal to repo | `npm view <pkg> version`; `gh api repos/frankxai/claude-skills-library/contents/.claude-plugin/marketplace.json` | FAIL |
| G7 | Gate receipts before money | `PRODUCT-RELEASE-GATE.md` G0–G5 receipts | `UNGATED`, 0 receipts | dated PASS with G5 price evidence | `Get-Content graph/products.graph.json` + `ls starlight/queen/reports/product-gates/` | FAIL |
| G8 | The queue stays admissible | open PRs in this repo / budget | 16 / 10 | <=10 at every PR | `gh search prs --repo frankxai/claude-skills-library --state open --limit 100 --json number` | FAIL |
| G9 | Craft bar is evidenced | four craft-receipt blocks; cross-provider critique closed | `[OPEN]` until this suite is reviewed | 4/4 blocks PASS, findings closed | `node tools/craft-receipt.mjs --product claude-skills-eval-pack --receipt <path>` | PENDING |
| G10 | Mobile-native public surface | §11.3 predicates passing on the catalog | `[OPEN]` - no new page built | 10/10, plus a real-device and reduced-motion Playwright project | `.claude/ci/web-guidelines-lint.mjs --changed` | BLOCKED (no UI in this slice) |
| G11 | Every harness has a measured install surface | adapter docs / measured surfaces | 14 adapter docs / 9 measured | 14/14 measured, `--verify` exit 0 | `node scripts/install-any-agent.mjs --all --verify` | FAIL |

## Registry drift found, not fixed here

The product row's `listType` is `"skills"`. `starlight/AGENTS.md` §12 fixes a nine-value enum and
`skill-pack` is the value for an installable skill repo. `tools/validate-products-graph.mjs` does
not enforce the enum today, so the drift passes validation. Fixing it is a control-plane write at
`starlight/graph/products.graph.json`; `tools/verify-lane.mjs` blocked this slice from writing at
the estate root, so the fix is **reported, not applied**. It is task T1 in `tasks/todo.md`.

The scoreboard also found **6 stale eval verdicts** on 2026-11-07 (`evaluatedAt` older than the
owning `SKILL.md` mtime): `agentic-orchestration`, `book-publishing`, `feynman-thinking`,
`hooks-automation`, `loop-designer` are the first five. T2 is therefore a P1, not future hardening;
G3 stays FAIL until those verdicts are re-run.

## Stop conditions

- Stop Phase 1 if `gen-skills-graph.mjs` exits 1 again. An ambiguous namespace means no catalog.
- Stop Phase 2 if the top-10 traffic skills cannot be ranked from `traffic/popular/paths`.
- Stop Phase 3 without publishing if G5 has no real `priceBand` rows. A discount without an
  anchor price fabricates the anchor (§5c.6).
- Stop any phase if a verdict is older than the `SKILL.md` revision it claims to cover.

## How the tracker stays honest

`scripts/eval-pack-scoreboard.mjs` reads the registry, the graph, the verdict store, live traffic
and live PR counts, then writes `scoreboard.latest.json` and prints the table. A metric whose
source command fails is reported as `[OPEN]` with the reason, never as zero. `--strict` exits 1 on
any FAIL so a phase cannot report green while G1 or G7 is red. The two dated traffic snapshots
(2026-10-24 and 2026-11-07) are overlapping rolling windows, not a comparable trend; the earlier
number is a dated measurement, not evidence of growth.
