# ADR-0004: Standard waitlist before any checkout

**Date**: 2026-08-31 `[RULED]`; applied to this product 2026-11-07
**Status**: accepted
**Deciders**: Frank via `starlight/TRUTH.md` §5c and `starlight/AGENTS.md` §5c; this ADR applies
the ruling to one product row

## Context

The registry row `claude-skills-eval-pack` is `UNGATED` with price evidence `none yet`. A live form
exists at `https://frankx.ai/waitlist` (probed 2026-11-07, HTTP 200), and the library README's CTA
points there. `TRUTH.md` §5c.3 records that form's backend as bespoke: it does not write a
`DemandSignal` row with a `productId`, so the cross-brand demand read is impossible. G5 needs a
real `priceBand`; none exists today (`packages/demand-capture/report.mjs` exits 1 on missing KV
credentials, 2026-11-07).

## Decision

This product's public surface is a waitlist, not a checkout, until a dated
`PRODUCT-RELEASE-GATE.md` PASS receipt exists. Install the standard two-step capture from
`packages/demand-capture/`: step 1 email, step 2 three skippable questions including the banded
price. Deliver the registry `gift` (one skill, its eval suite, and the run output showing which
cases fail) in the first email before asking anything else. `publicCount` stays `null` below the
threshold of 50; the 50-signal milestone is honoured only with real counts and dated
`publishedAt` / `honouredAt`.

### Alternatives considered

**Point the CTA straight at a Polar checkout**
- Pros: shortest path to the first dollar.
- Cons: no price evidence, no audience evidence, first-time publication and money are Frank's;
  a discount would fabricate an anchor price (§5c.6).
- Why not: a separate paid product has a gated slot; this product is not it.

**Keep the existing bespoke `frankx.ai/waitlist` form**
- Pros: it renders and captures an email today; zero build.
- Cons: no `productId`, no `priceBand`, no standard read; the estate has zero price evidence for
  any of 25 products precisely because captures were bespoke.
- Why not: a live door that captures something beats a 404, but it is recorded as bespoke and
  migrated, never left as done (§5c.3).

**Publish a count to create urgency**
- Pros: social proof.
- Cons: below threshold it is an invented number; `TRUTH.md` provenance discipline makes that
  unrecoverable.
- Why not: silence beats "join 12 others".

## Consequences

### Positive
- G5 gets a real field instead of a hypothesis; build order can sort by would-pay.
- Every brand's capture writes the same schema, so the cross-brand read works.
- The gift is a carved-out slice of the real product, not a lead magnet.

### Negative
- No revenue until Frank provisions KV + Resend and rules on a price.
- The capture code fails closed today, so Phase 2 looks incomplete from the outside.

### Risks
- A deadline or seat count slips into copy. Mitigation: `check_links.py` plus a prose lint for
  seeded counts, deadlines and discount language before any page ships.
- Personal data leaks into git or a report. Mitigation: KV and Resend only, aggregate reporting,
  secret pre-commit hook already armed at the estate root.
