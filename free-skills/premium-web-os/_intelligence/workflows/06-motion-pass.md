# 06 — Motion Pass

**Purpose:** Add choreographed motion to the frozen composition — one cinematic beat, serving hierarchy, with a reduced-motion fallback.

## Inputs

- The static composition from [`05-implementation.md`](./05-implementation.md).
- [`../motion.md`](../motion.md) — the named primitives, easings, personality, and rules.
- The scene briefs' motion intent + reduced-motion intent.
- [`../accessibility.md`](../accessibility.md) — reduced-motion obligations.

## Steps

1. **Earn one cinematic beat per page.** Pick the single moment that deserves choreography (usually the hero reveal or one scroll-scrubbed sequence). Everything else gets restrained, supportive motion or none.
2. **Use the named primitives** from [`../motion.md`](../motion.md) (e.g. `heroReveal`, staggered reveals, magnetic hover, expo easing). Do not hand-roll durations scene by scene; reuse the vocabulary.
3. **Motion serves hierarchy.** Each animation must direct attention or reveal structure. If it only decorates, cut it. No bounce, no constant float, no random particles, no over-stagger.
4. **Animate transforms + opacity only.** No layout-thrashing properties; one scroll system for the whole page.
5. **Build the reduced-motion fallback now,** not later: honor `prefers-reduced-motion`, replace the beat with an instant/static reveal, keep all content reachable. Verify per [`../accessibility.md`](../accessibility.md).
6. **Re-check the composition still leads.** Motion must not fight the static hierarchy you locked in step 05 — if it does, the motion is wrong.
7. **Verify it builds** and the scroll holds 60fps in a quick local check (full budget enforcement is [`08-performance-pass.md`](./08-performance-pass.md)).

## Output / artifact

The composition with **one choreographed beat** + supportive restraint elsewhere, a working reduced-motion path, transforms/opacity only, one scroll system.

## Gate

Exactly one cinematic beat; all motion uses the named primitives; reduced-motion fallback verified; no jank in local scroll; build + types clean.

## Next

3D pass per [`../three-webgl.md`](../three-webgl.md) (only if the scene brief specifies a metaphor + budget + fallback), then [`07-visual-qa.md`](./07-visual-qa.md).
