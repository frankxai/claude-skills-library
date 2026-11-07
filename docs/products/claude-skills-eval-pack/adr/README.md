# Architecture Decision Records

Decisions for `claude-skills-eval-pack`. Status: `accepted` means in effect and followed;
`proposed` means recorded but not yet built. Frank's words are `[RULED]` and only Frank changes
them. Backfilled decisions name their original date.

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-verdict-registry.md) | Verdicts live in a separate machine-readable registry | accepted | 2026-10-25 |
| [0002](0002-promptfoo-eval-runner.md) | Promptfoo with deterministic assertions first | proposed | 2026-11-07 |
| [0003](0003-catalog-owns-namespace.md) | The public catalog owns a skill name | accepted (RULED) | 2026-10-24 |
| [0004](0004-waitlist-before-checkout.md) | Standard waitlist before any checkout | accepted (RULED 2026-08-31) | 2026-11-07 |

Template: a decision is worth recording when it fixes a boundary that later work will otherwise
re-litigate. Trivial naming and formatting choices are not ADRs. Any ADR that stops being true is
marked `superseded by ADR-NNNN`, never deleted.
