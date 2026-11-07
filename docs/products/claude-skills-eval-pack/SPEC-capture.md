# Spec: capture

Module id `capture` · depends on `catalog` · status: blocked on Frank's credential gate.

## Objective

One standard waitlist door for this product that writes a `DemandSignal` row with
`productId: "claude-skills-eval-pack"`, a banded price answer, and the buyer's context. The
registry row already declares the gift: one skill with its full promptfoo eval suite, including
the run output that shows which cases fail. The gift ships before the price question (§5c.6).

## Tech stack

`starlight/packages/demand-capture/` - the drop-in, never a bespoke form. KV for the signal,
Resend for the first email inside 60 seconds. No new dependencies. The door lives on the catalog
surface; `https://frankx.ai/waitlist` is a live form today but is recorded as bespoke in
`starlight/TRUTH.md` §5c.3 and is **not** this product's standard door.

## Commands

```text
node starlight/packages/demand-capture/report.mjs       # exit 1 today: KV credentials missing
gh api repos/frankxai/claude-skills-library/traffic/views
node scripts/eval-pack-scoreboard.mjs --estate-root C:/Users/frank/starlight
```

Provisioning `KV_REST_API_URL/TOKEN` and Resend keys is Frank's. The code path fails closed until
they exist; it does not fall back to a `mailto:` or a Google Form.

## Project structure

```text
starlight/packages/demand-capture/src/types.ts        # DemandSignal, PriceBand, WaitlistState
<surface>/app/api/demand/route.ts                   # standard two-step endpoint
<surface>/app/waitlist/page.tsx                     # step 1: email; step 2: three questions
starlight/graph/products.graph.json                  # waitlist thresholds, gift, milestones
```

## Code style

Use the real exported type, not a lookalike:

```ts
import type { DemandSignal, PriceBand } from '@starlight/demand-capture'

const signal: DemandSignal = {
  productId: 'claude-skills-eval-pack',
  email,
  source: 'claude-skills-library/catalog',
  priceBand,        // asked in step 2, skippable
  position,         // real KV position, never seeded
  createdAt: new Date().toISOString(),
  consent: true,
}
```

`publicCount` stays `null` below the registry's `publicCountThreshold` of 50. Never estimate it.

## Testing strategy

- Unit: the endpoint writes a row with all required fields, rejects a missing `productId`, and
  leaves `publicCount` null under threshold.
- Security/denial: rate limiting, malformed email, repeat submission, and a simulated KV outage
  that returns an honest error instead of a silent success.
- Recovery: interruption after step 1 can be resumed; the gift email retry is idempotent.
- Evidence: `report.mjs` must read the row back. Until it does, G4 is `[OPEN]`.

## Boundaries

- Always: two steps, three skippable questions, `consent: true`, aggregate reporting only.
- Ask first: a new destination for Resend, any change to the gift, any public count.
- Never: capture into git or a report; use a discount as the offer; publish a deadline that is
  not a dated commitment; honour the 50-signal milestone without dating `honouredAt`.

## Success criteria

`report.mjs` exits 0 and returns at least one signal for this product with a `priceBand`; the
gift is delivered inside 60 seconds with its failing cases attached; the scoreboard reports G4
with a measured number instead of BLOCKED.

## Open questions

`[OPEN]` where the standard door is hosted while the docs platform DNS records are pending. The
catalog's own surface is the preferred answer; no new domain is created in this slice.
