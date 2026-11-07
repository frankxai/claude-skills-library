# Design, craft and intelligence expectations

2026-11-07 · OpenCode · applies to any public surface built for `claude-skills-eval-pack`.
This document sets the bar; it does not claim a page has been built. No UI is implemented in this
slice, so the visual reference lock is deliberately deferred rather than faked.

## Research log (opened live, all 2026-11-07)

| Reference | URL | What it proves | What we adapt |
|---|---|---|---|
| Promptfoo, "Test Agent Skills" | https://www.promptfoo.dev/docs/guides/test-agent-skills/ | evals need `skill-used` plus near-miss `not-skill-used`, deterministic assertions first, `--repeat 3`, `--no-cache`, `-o results.json` | the content model of a receipt: passes, failures, exact revision |
| Anthropic, `anthropics/skills` README | https://raw.githubusercontent.com/anthropics/skills/main/README.md | canonical skill format, spec, licenses, and the disclaimer "Always test skills thoroughly in your own environment" | the honest gap we close: publish the test instead of asking the buyer to run it |
| skills.sh, the agent skills directory | https://www.skills.sh/ | cross-agent discovery ranked by installs; popularity is not behaviour | one install CTA per listing, with a verdict beside the count, not in place of it |
| Linear changelog, 5 November 2026 | https://linear.app/changelog | a dense developer surface that wraps header controls on narrow widths, states agent status plainly, and ships mobile diff review | information density, honest state labels, narrow-width behaviour; not its palette |

Research summary: four references across eval mechanics, skill format, discovery and product UI.
Primary direction for content: Promptfoo's receipt model. Do not average the four into a polite
midpoint. No palette, typeface or component is borrowed without a locked reference.

## Reference lock - DEFERRED, on purpose

```text
Primary reference: none locked. No UI is built in Phase 0-1.
Preserve: the repo's existing README/CATALOG typography and the estate's brand tokens.
Borrow only: Linear's narrow-width wrapping and plain status labels, when a page is built.
Role rules: verdict colours (if any) state PASS / REVISE / FAIL / UNEVALUATED; they are never decoration.
Media strategy: no generated imagery. Receipts are code and text; use real run output.
Reject: hero -> three cards -> CTA, gradient orbs, seeded counts, "trusted by", invented scarcity.
Token commitments: deferred to the Phase 2 lock. Until then, no new token is introduced.
```

Before any Phase 2 page work: open three current visual references, choose one dominant direction,
write the decision ledger into this file, and get the lock approved. A brief is not a build target.
This is the `refero-design` non-negotiable; it is recorded as unmet-for-now, not silently skipped.

## Decision ledger (non-visual decisions, all traceable)

| Decision | Source | Why |
|---|---|---|
| Failure cases are shown next to passes | Promptfoo guide + registry `gift.deliverable` | the failures are the differentiator; hiding them is the generic move |
| `UNEVALUATED` is a visible state | `ops/skill-eval-verdicts.json` has 30 of 606 names | 576 skills have no verdict; a green-only catalog would lie |
| One install CTA per listing | §12 "one repo, one line, one CTA" | two competing actions split the buyer |
| Counts come from generators | §13 "counts are generated, never typed" | README totals already fail CI when hand-maintained |
| Verdicts are machine-readable JSON | `graph/skills.graph.json` | the buyer's agent is a first-class user (§11.4) |

## The 11.3 predicates, applied when a page exists

| # | Check | Command |
|---|---|---|
| 1 | root layout `viewportFit: 'cover'` | `grep -n "viewportFit" app/layout.tsx` |
| 3 | `app/manifest.ts` with `display: 'standalone'`, resolvable icons, no CSS variables | `node -e` over the manifest + `ls public/` |
| 4 | `100dvh` shells, `100svh` heroes, no bare `100vh` | lint rule `vh-not-dvh` |
| 5 | tap highlight, text size adjust, `touch-action`, 16px inputs | `grep -n` on `app/globals.css` |
| 8 | hover only inside `@media (hover: hover) and (pointer: fine)` | lint rule `hover-ungated` |
| 9 | no `user-scalable=no`, no `maximum-scale=1` | lint rule `no-zoom` |
| 10 | real-device Playwright project plus reduced-motion project | `grep -n "devices\\[" playwright.config.ts` |

Enforcement: `.claude/ci/web-guidelines-lint.mjs --changed`, from the `web-excellence` pack, never
a hand-edited vendored copy. Predicates 2, 6 and 7 apply where their `why` holds. Emulation is not
evidence; name the hardware in the receipt.

## Accessibility and motion (non-negotiable)

WCAG 2.2 AA contrast, keyboard focus visible on every control, sentence case in designed
interfaces, 44px-class touch targets, `prefers-reduced-motion` as a first-class path, no zoom lock,
no content under the notch, no sticky hover after tap. Check interrupted transitions and recovery
after a failed form submit. Motion explains state or focus; it never decorates body text.

## Anti-slop (§11.1)

No generic hero/grid/carousel. No "seamless", "unleash", "next-gen", "revolutionary", "supercharge",
"empower", "10x". No ungrounded claim, no count nobody ran, no "trusted by". Every claim maps to
an evidence path (G0). One screen, one job on a phone. Prose follows `humanizer` 3.1.0: lead with
the decision, cut inflated significance and chatbot residue, no decorative bold, no em dash unless
Frank's own sample uses one.

## Intelligence expectations (§11.4, §5d)

A surface where the buyer's agent is a first-class user (§11.4):

- `/.well-known/starlight.json` and install manifests per harness, served from the same substrate
  as the human page.
- An MCP endpoint exposing the catalog and verdicts; `mcp-doctor score` clean on the seven
  criteria, 100% at ship.
- A CLI with `--json` and stable exit codes; a failed gate reports its verdict **and** its exit code.
- `graph/skills.graph.json` as the machine-readable truth: one install slug → one owning repo,
  version and eval verdict. Today: 606 names, 0 conflicts, 115 versioned, 30 with an eval
  (`node tools/gen-skills-graph.mjs`, 2026-11-07).
- Cost awareness: Linear's usage explorer (opened today) is the reference for reporting provider
  spend by feature; the north-star metric stays `[OPEN]` until the estate cost collector runs.

## Craft receipt (§5b.1)

A PR that touches a product or public surface carries four named blocks: Research (three sources
with URL and read date), Bar (`mustBeat[]` with per-item verdict), Refinement (the second pass's
diff stat), Critique (a different provider, prompted as a buyer who declined to pay, with findings
and fixes). Validator: `node tools/craft-receipt.mjs --product <id> --receipt <path>`.
Same-provider critique is recorded as missing, not as done. [CRAFT-RECEIPT.md](CRAFT-RECEIPT.md)
is this suite's receipt; its critique block is filled only after an independent review runs.
