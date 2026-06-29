# Performance

Speed is part of the design. A premium site that janks is not premium.

## Budgets (targets)

- **LCP < 2.5s** · **INP < 200ms** · **CLS < 0.1** · 60fps scroll.
- Hero JS budget: minimize above-fold interactivity. Everything non-critical is dynamic-imported `ssr: false`.

## Rules

- **Images:** `next/image` with `sizes`, AVIF/WebP, never raw `<img>` for hero/above-fold. The 3D poster doubles as the LCP image.
- **Fonts:** self-host / `next/font`, preload the display face, `font-display: swap`, subset.
- **3D/heavy visuals:** lazy-load, DPR cap `[1,2]`, bounded particles, dispose on unmount, no heavy postprocessing on mobile (see `three-webgl.md`).
- **Motion:** animate transforms/opacity only; one scroll system; respect reduced-motion (also a perf win).
- **Bundles:** `LazyMotion`+`domAnimation` (not `domMax`); code-split per route; tree-shake icons (no full icon-font).
- **Dev hygiene:** verify with a production **build**, not a long-running `dev` server (RAM). Never run `dev` and `build` simultaneously.

## Verification

Lighthouse on a preview build (Gate 3). Check the real LCP element, total blocking time, and CLS sources. Record any deliberate trade-off in `decision-log.md`. Full: `checklists/release-check.md`.
