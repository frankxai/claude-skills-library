---
description: Put a per-product waitlist on a product page, or verify the one there, then read would-pay demand before choosing what to build
argument-hint: <product id or page url>
---

Load the `revenue-protocol` skill. Target: $ARGUMENTS

1. Find the product's registry row (the repo's product list or graph). No row means
   add the row first: id, buyer, the products it must beat, price hypothesis, gate
   status. No page work before the row exists.
2. Read the page. Classify its door:
   - dead: the call to action leads to a 404 or a checkout for a product that has
     not passed its release gate. Fix this first, in this session.
   - bespoke: a mailto, a third-party form, or any capture that does not record which
     product the person wants. Record it and migrate it to the standard capture.
   - standard: the shared capture component, two steps, product id recorded.
3. Install or verify the standard capture. Ask three skippable questions after the
   person is already in: expected price band, who they are, what they are trying to do.
4. Offer a gift that is a real slice of the product, delivered in the first email.
   Scarcity is honest: a founding window that closes at launch. Never a seeded count,
   an undecided date, a resetting timer, or a discount off a price that does not exist.
5. Read demand with the repo's report command if it exists. Sort by would-pay, never
   by signup count. If the report cannot run (missing credentials or no data), say so
   and fall back to the operator's stated priority. Never claim to have read demand
   you did not read.

Waitlist entries are personal data: never write them to git or to a report that
leaves the operator's systems. Aggregate only.
