# Phases - claude-skills-eval-pack

Each phase has a done-condition, the command that proves it, and a stop condition. A phase is not
complete because its documents exist; it is complete when its verification command says so. Phases
1 and 2 are agent-executable. Phase 3 needs Frank's credential gate. Phase 4 is Frank's release.

## Phase 0 - Definition (complete 2026-11-07)

**Done-condition:** PRD, capability map, five module specs, goals, design expectations, ADRs,
plan, task list and a runnable scoreboard exist in the owning repo on a dedicated branch.

**Verify:**
```text
node scripts/eval-pack-scoreboard.mjs --estate-root <starlight-root>
node starlight/tools/craft-receipt.mjs --product claude-skills-eval-pack --receipt docs/products/claude-skills-eval-pack/CRAFT-RECEIPT.md
```

**Stop condition:** a different provider's critique finds an unclosed finding in the suite. Fix
and re-run before declaring the phase done.

## Phase 1 - Proof plumbing (agent-executable)

Harden what exists: fix the registry `listType` drift, add the staleness check to `verdict-store`,
add agent-exercising suites to `eval-runner`, and rank the first ten skills from measured traffic.

**Done-condition:** `gen-skills-graph.mjs` exits 0; `counts.withEval` equals registry `passed`;
every PASS has a resolvable receipt; a planted missing-receipt fault fails; the top-10 traffic
skills are named with their verdict state.

**Verify:** `node scripts/eval-pack-scoreboard.mjs --estate-root <starlight-root> --strict`
(G1 may still be FAIL; G2 and G3 must be PASS).

**Stop condition:** any unresolved namespace conflict, or a verdict older than the `SKILL.md` it
claims to cover.

## Phase 2 - Catalog and capture (partly blocked)

Add verdict and receipt columns to the generated catalog, then install the standard two-step
`DemandSignal` door with the packaged gift. No new domain, no new site.

**Done-condition:** `generate_catalog.py --check`, `generate_site.py --check`, `check_counts.py`
and `check_links.py` all exit 0; every listing shows an honest verdict state; `report.mjs` exits 0
with at least one signal carrying a `priceBand`.

**Verify:** the four generators plus
`node starlight/packages/demand-capture/report.mjs`.

**Gate:** KV + Resend credentials are Frank's. Without them the capture half stays BLOCKED; the
catalog half can still land. Do not substitute a bespoke form to make the phase look finished.

**Stop condition:** a listing renders a green state without a resolvable receipt.

## Phase 2b - Any-agent install surfaces (built 2026-11-07)

One manifest, a deterministic generator, an any-agent CLI and one stub adapter per harness. Built
because the library shipped six adapters while the estate runs more harnesses than that.

**Done-condition:** 14 entries in `runtimes/harnesses.json`, 14 adapter docs on disk, the six
pre-existing docs byte-unchanged, and `HARNESS-COVERAGE.md` names a canonical repo or a measured
gap for each.

**Verify:**
```text
node scripts/gen-harness-adapters.mjs --check
node scripts/install-any-agent.mjs --all --verify
```

**Gate:** no live install, no junction, no home-directory stub, no global config edit and no new
repository. A live install is a separate authorized action with a dated receipt under
`queen/reports/`. New repositories and repo visibility are Frank's.

**Stop condition:** `--verify` exits non-zero, or a distributed artifact carries an
operator-specific path.

## Phase 3 - Evidence and gate receipts (gated)

Aggregate real price bands, package the gift, run G0–G5, and close the craft receipt's critique
findings.

**Done-condition:** `PRODUCT-RELEASE-GATE.md` receipts for G0–G5 with dated PASS rows; G5 cites
real `priceBand` rows; the registry `gate` string carries a date; four craft-receipt blocks PASS;
a different provider reviewed the exact revision.

**Verify:** `ls starlight/queen/reports/product-gates/` and the scoreboard G7 row.

**Gate:** the 50-signal milestone is published only when the real count reaches 50, with
`publishedAt` and `honouredAt` set. Prices and checkout stay Frank's.

**Stop condition:** no real price evidence. Do not publish a count, a deadline or a discount.

## Phase 4 - First release (Frank's)

Version the pack, publish, verify install on three harnesses and verify production after merge.

**Done-condition:** `npm view <pkg> version` equals the repo version; plugin listing live; three
clean installs recorded; registry `stage` moves off `concept`.

**Verify:** `npm view <pkg> version`, `gh api .../marketplace.json`, `node tools/pr-gate.mjs verify`.

**Gate:** first-time publication, repo visibility, price, checkout, email and social are Frank's
(§5e). Nothing in this suite performs them.

**Rollback:** revert the merge the same session; the pack stays unpublished until re-approved.

## Cross-phase rules

- One writer per worktree. Draft-first PRs; `gh pr ready` only when complete.
- Every PR quotes this repo's open-PR count against the 10-PR budget in its body. It is 16 today,
  so no new PR opens here until one is landed or closed (§13 admission control).
- Merges go through `tools/pr-gate.mjs` with a sign-off from a different harness.
- Counts are generated. A metric whose source command fails reports `[OPEN]`, not zero.
- The scoreboard is re-run at every phase boundary; `scoreboard.latest.json` is the evidence.
