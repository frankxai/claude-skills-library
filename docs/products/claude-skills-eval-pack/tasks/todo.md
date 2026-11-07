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
