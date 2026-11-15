# Spec: publication

Module id `publication` · depends on `catalog`, `capture`, G5 · status: gated, not started.

## Objective

One versioned, installable pack that a stranger can install into three harnesses today, with a
`PRODUCT-RELEASE-GATE.md` PASS receipt behind it. Publish state is measured, not claimed
(§12): `npm view <pkg> version` and a live plugin listing, never a README sentence.

## Tech stack

The repo's existing `.claude-plugin/marketplace.json`, `npx skills add`, the six runtime adapter
guides under `runtimes/`, and a version equal to the repo's package version. No new rails until
Frank rules; Polar/Whop/Gumroad are distribution, not publication.

## Commands

```text
python3 scripts/validate_skills.py
python3 scripts/generate_catalog.py --check
node --test scripts/tests/absorb.test.mjs
npm view <pkg> version
gh api repos/frankxai/claude-skills-library/contents/.claude-plugin/marketplace.json
node starlight/tools/pr-gate.mjs verify --repo frankxai/claude-skills-library --pr <N>
```

## Project structure

```text
.claude-plugin/marketplace.json
docs/CATALOG.md                        # generated
starlight/queen/reports/product-gates/<product-id>-<date>.md   # G0–G5 receipt
starlight/queen/reports/craft/<product-id>-<date>.md           # four-block craft receipt
```

## Code style

A gate receipt is a dated artifact with one row per gate and an evidence path per row:

```markdown
| Gate | Verdict | Evidence | Date |
|---|---|---|---|
| G0 Claim truth | PASS | docs/CATALOG.md @ 2f980f5 | 2026-11-07 |
| G5 Price integrity | BLOCKED | KV credentials missing | 2026-11-07 |
```

No gate is marked PASS without a path. A skipped gate is a failure, not a pass.

## Testing strategy

- G0 every claim maps to an evidence path; G1 deterministic pass; G2 agentic end-to-end buyer
  simulation; G3 independent provider review (maker ≠ checker); G4 post-install experience after
  a real install; G5 price evidence from `DemandSignal.priceBand`.
- Install on Claude Code, Codex and OpenCode from a clean machine state; record install time and
  the first successful skill invocation.
- Rollback: an uninstall returns the harness to its prior state.

## Boundaries

- Always: draft-first PR, explicit pathspec staging, pr-gate merge, production verification after
  merge, revert a wrong merge the same session.
- Ask first: any first-time publication, repo visibility change, package release, price, checkout,
  email or social post. These are Frank's in §5e.
- Never: publish with `gate: UNGATED`; ship a first draft; claim a PASS without its receipt; delete
  an unmerged branch.

## Success criteria

A stranger can install the pack on three harnesses today; `npm view` matches the repo version;
G0–G5 receipts exist with dated PASS rows; the registry `gate` string carries a date; the
scoreboard reports G6 and G7 PASS. Until then this module stays in `tasks/todo.md` as gated.

## Open questions

`[OPEN]` whether the first release is free with eval receipts behind a waitlist, or a paid pack.
The price hypothesis is `25-99` EUR with evidence `none yet`; no price is set until G5 has real
bands. `[OPEN]` which package name; the repo has no `package.json` today.
