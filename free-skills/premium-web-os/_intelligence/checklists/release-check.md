# Release Check — The Single Gate

> The master pass/fail before merge. Aggregates every other checklist plus the build, performance, accessibility, and anti-pattern gates from [`../quality-gates.md`](../quality-gates.md). Any unchecked box blocks the merge.

## Build + types + lint

- [ ] Production **build** is green (verified with a real build, not a long-running `dev` server).
- [ ] TypeScript is clean — zero errors.
- [ ] Lint is clean.

## Upstream checklists pass

- [ ] **Taste rubric ≥ target** — [`taste-check.md`](./taste-check.md) (flagship: ≥4 every axis, 5 focal).
- [ ] **Design** — [`design-check.md`](./design-check.md) fully checked.
- [ ] **Motion** — [`motion-check.md`](./motion-check.md) fully checked.
- [ ] **WebGL** — [`webgl-check.md`](./webgl-check.md) fully checked (only if the page ships 3D).
- [ ] **Agent hygiene** — [`agent-check.md`](./agent-check.md) fully checked.

## Performance budgets met

- [ ] LCP < 2.5s · INP < 200ms · CLS < 0.1 (Lighthouse on a preview build).
- [ ] 60fps scroll on mid hardware.
- [ ] Hero above-fold JS minimized; non-critical work dynamic-imported `ssr: false`.
- [ ] Images via `next/image` with `sizes` (AVIF/WebP); fonts self-hosted/`next/font`, display face preloaded, subset.

## Accessibility (WCAG 2.2 AA)

- [ ] Contrast: body ≥ 4.5:1, large text/UI ≥ 3:1 (dark theme still passes).
- [ ] Keyboard: every interactive element reachable + operable; visible focus state; logical tab order.
- [ ] Semantics: real landmarks, one `h1`, no heading-level skips, meaningful `alt` (empty on decorative), labels on inputs.
- [ ] Touch targets ≥ 44px.
- [ ] No rapid flashing; auto-motion/parallax has a stop or reduced-motion path.
- [ ] Lighthouse a11y + manual keyboard pass + screen-reader smoke on hero + primary CTA done.

## Reduced-motion + mobile + fallback verified

- [ ] `prefers-reduced-motion` path verified for every reveal, the scroll beat, ambient drift, and all 3D.
- [ ] Mobile verified at 375px — intentional scene, hierarchy + drama preserved, body ≥16px.
- [ ] 3D static poster fallback, mobile simplification, and frozen reduced-motion state verified (if 3D).
- [ ] Playwright screenshots captured at 1920 / 1440 / 768 / 375.

## Gate-3 anti-pattern grep clean

- [ ] No banned fonts in app code (Inter / Space Grotesk / Cinzel).
- [ ] No raw hex in app code.
- [ ] No `domMax` (must be `domAnimation`).
- [ ] No purple-on-white / generic SaaS gradient.
- [ ] No emoji-as-icons or Unicode-glyph icons.

## Decision log

- [ ] [`../decision-log.md`](../decision-log.md) updated: dependency additions, deliberate trade-offs, deferred items.
- [ ] Committed page spec describes what actually shipped.

---

**Verdict:** PASS only if every applicable box above is checked. One miss → iterate, do not merge.
