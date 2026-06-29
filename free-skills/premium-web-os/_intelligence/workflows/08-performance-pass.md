# 08 — Performance Pass

**Purpose:** Enforce the Core Web Vitals budget — speed is part of the design. A premium site that janks is not premium.

## Inputs

- The QA-passed scene from [`07-visual-qa.md`](./07-visual-qa.md).
- [`../performance.md`](../performance.md) — budgets, image/font/3D/motion rules.
- [`../three-webgl.md`](../three-webgl.md) — 3D lazy-load + DPR/particle bounds (if 3D present).

## Steps

1. **Hold the budgets:** **LCP < 2.5s · INP < 200ms · CLS < 0.1 · 60fps scroll.** These are pass/fail, not aspirations.
2. **Images:** `next/image` (or framework equivalent) with `sizes`, AVIF/WebP, never raw `<img>` above the fold. The 3D poster doubles as the LCP image.
3. **Fonts:** self-host / `next/font`, preload the display face, `font-display: swap`, subset. Eliminate layout shift from font swap (protects CLS).
4. **Lazy-load 3D and heavy visuals:** dynamic-import `ssr: false`, DPR cap `[1,2]`, bounded particles, dispose on unmount, no heavy postprocessing on mobile — per [`../three-webgl.md`](../three-webgl.md).
5. **Trim above-fold JS:** minimize hero interactivity; everything non-critical is deferred. Animate transforms/opacity only; one scroll system.
6. **Run Lighthouse** on a production preview build (not `dev`). Measure on a throttled/mobile profile, not just desktop.
7. **Fix the worst offender first** (usually LCP image or above-fold JS), re-measure, repeat until every metric is inside budget.

## Output / artifact

A **performance result**: Lighthouse scores + the four CWV numbers against budget, the optimizations applied, and confirmation 3D is lazy with a poster LCP.

## Gate

LCP < 2.5s, INP < 200ms, CLS < 0.1, 60fps scroll — all met on a production preview; 3D lazy + poster verified; image/font rules satisfied.

## Next

Release gate ([`../checklists/release-check.md`](../checklists/release-check.md)) → [`09-handover.md`](./09-handover.md)
