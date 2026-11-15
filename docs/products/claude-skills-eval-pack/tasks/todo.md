# Task list - claude-skills-eval-pack

Ordered by dependency. Each task is one focused session, touches roughly five files or fewer, and
has an acceptance condition plus a command that verifies it. Nothing here is marked done.

- [ ] T1 - Fix the registry `listType` drift (control-plane, separate lane required)
  - Acceptance: `claude-skills-eval-pack.listType` is `skill-pack`; `validate-products-graph.mjs`
    enforces the nine-value enum from `AGENTS.md` §12.
  - Verify: `node tools/validate-products-graph.mjs`
  - Files: `graph/products.graph.json`, `tools/validate-products-graph.mjs`
  - Blocked note: `tools/verify-lane.mjs` refused this slice a write at the estate root. Claim a
    control-plane lane first; do not edit from a product worktree.

- [ ] T2 - Add the verdict staleness and receipt checks
  - Acceptance: a verdict older than its owner `SKILL.md` mtime is reported; a verdict with no
    resolvable `receipt` fails; a planted missing-receipt fault exits 1.
  - Verify: `node tools/gen-skills-graph.mjs` and the new check script
  - Files: new `tools/check-skill-verdicts.mjs`, `tools/eval-skills-suite.mjs`, its test

- [ ] T3 - Rank the first ten skills from measured traffic
  - Acceptance: a dated list of ten skill slugs with their verdict state, produced by a command.
  - Verify: `gh api repos/frankxai/claude-skills-library/traffic/popular/paths`
  - Files: `docs/products/claude-skills-eval-pack/scoreboard.latest.json`, scoreboard script

- [ ] T4 - Add agent-exercising Promptfoo suites for the first ten
  - Acceptance: positive, near-miss `not-skill-used`, and output-check cases per skill; receipts
    record model, provider, settings and exact `SKILL.md` revision.
  - Verify: `npx promptfoo@latest eval -c evals/promptfoo.yaml --repeat 3 --no-cache -o evals/results.json --no-share`
  - Files: `evals/promptfoo.yaml`, `evals/cases/*.json`, `evals/fixtures/*`, `evals/results.json`

- [ ] T5 - Add verdict and receipt columns to the generated catalog
  - Acceptance: all 606 resolved names show an honest state; every PASS links a resolvable
    receipt; no green badge without a receipt.
  - Verify: `python3 scripts/generate_catalog.py --check`, `python3 scripts/generate_site.py --check`, `node scripts/check_links.py`
  - Files: `scripts/generate_catalog.py`, `scripts/generate_site.py`, `docs/CATALOG.md`, `docs/index.html`, `scripts/check_links.py`

- [ ] T6 - Package the registry gift
  - Acceptance: one skill with its eval suite and run output showing the failing cases exists at a
    resolvable `gift.assetPath`, and the registry field points at it.
  - Verify: `node tools/validate-products-graph.mjs`; open the asset
  - Files: `gift/` asset, `graph/products.graph.json` (control-plane lane)

- [ ] T7 - Install the standard two-step capture (gated on Frank's credentials)
  - Acceptance: a `DemandSignal` with `productId`, `priceBand` and `consent: true` is written and
    read back; `publicCount` stays null below 50.
  - Verify: `node packages/demand-capture/report.mjs`
  - Files: the waitlist route, the page, the first-email template
  - Gate: KV + Resend credentials. No bespoke fallback.

- [ ] T8 - Run G0–G5 and write the dated receipts (gated on T7)
  - Acceptance: one receipt per gate with an evidence path; G5 cites real `priceBand` rows;
    registry `gate` carries a date; craft receipt four blocks PASS.
  - Verify: `node tools/craft-receipt.mjs --product claude-skills-eval-pack --receipt <path>`;
    `ls queen/reports/product-gates/`
  - Files: `queen/reports/product-gates/*`, `queen/reports/craft/*`, registry row

- [ ] T9 - Independent review at the exact revision (maker ≠ checker)
  - Acceptance: a different provider critiques the pack as a buyer who declined to pay; findings
    are fixed or answered with a reasoned decline; the receipt records both.
  - Verify: `codex exec -p review -s read-only --skip-git-repo-check "<prompt>"`
  - Files: `CRAFT-RECEIPT.md`, the reviewed files

- [ ] T10 - Version and publish (Frank's gate, not an agent task)
  - Acceptance: `npm view <pkg> version` equals the repo version; plugin listing live; three
    clean installs recorded; production verified after merge.
  - Verify: `npm view <pkg> version`, `gh api .../marketplace.json`, `node tools/pr-gate.mjs verify`
  - Files: `.claude-plugin/marketplace.json`, `package.json`, `docs/CATALOG.md`
  - Gate: first-time publication, repo visibility, price and checkout are Frank's (§5e).

- [x] T11 - Add planted-fault tests for the harness generator and CLI (DONE 2026-11-07)
  - Acceptance: removing a generated marker makes `--verify` exit 3; adding an operator-specific
    path makes it exit 4; an unknown harness exits 2; a second `--write` writes 0 files.
  - Verify: `node --test scripts/tests/harness-surface.test.mjs` (9/9 pass); `node scripts/gen-harness-adapters.mjs --check` twice
  - Files: `scripts/tests/harness-surface.test.mjs`, the two scripts
  - Evidence: written RED first for the path-state behavior, then GREEN; all nine tests pass in
    isolated temp fixtures with a fake HOME. RED output preserved in `evidence/red-green-2026-11-07.md`.

- [x] T12 - Resolve the five `[OPEN]` discovery paths (DONE 2026-11-07, read-only research)
  - Acceptance: Kilo, OpenClaw/Claws, Copilot, Factory Droid and Starlight Claws get a measured
    discovery path with a source and read date, or stay `[OPEN]` with the failed probe recorded.
  - Verify: `node scripts/install-any-agent.mjs --all --verify` reports 12/14 sourced paths,
    7 verified, 5 documented, 2 open.
  - Files: `runtimes/harnesses.json`, the five generated stubs, `HARNESS-COVERAGE.md`
  - Evidence: `~/.copilot/skills` and `~/.factory/skills` verified on disk; Kilo documented from
    the home guide with the `kilo.ps1` launcher present; OpenClaw and Starlight Claws remain
    `[OPEN]` with their failed probes recorded in the manifest.

- [ ] T13 - Live installs with dated receipts (Frank's gate)
  - Acceptance: each authorized install projects the whole pack root, preserves full skill bodies,
    guards Windows reparse points, and writes `queen/reports/harness-install-<date>.md`.
  - Verify: `node scripts/install-any-agent.mjs --all --verify` plus the receipt files
  - Files: home/config surfaces outside this repo, receipt files
  - Gate: global config writes and any home-directory stub need Frank. No live install happened in
    this slice.

- [ ] T14 - Route the five config-repo gaps (Frank's gate, do not invent repos)
  - Acceptance: each of the five harnesses without a config repo has a named routing check against
    `starlight/repos` and the frankxai GitHub list, then a HumanGate decision with a
    recommendation. No repository is created by an agent.
  - Verify: `python ~/.starlight/workspace-bootstrap/route_work.py find <harness>`
  - Files: `HARNESS-COVERAGE.md`, the estate objective ledger
  - Gate: repository creation and first-time publication are Frank's.
