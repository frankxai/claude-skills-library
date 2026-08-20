---
name: core-web-vitals
description: Measure and hold a real performance budget on a web page — LCP, INP, CLS, bundle weight, font and image loading. Use when a change touches images, fonts, above-the-fold markup, client components, third-party scripts, or any list that can grow; when a page feels slow; or before shipping a new landing page or hero. Produces measured numbers from Lighthouse or the build output, never estimates. Also states honestly when measurement is impossible in the current environment instead of guessing.
---

# Core Web Vitals

The rule: **report measurements or report that you could not measure.** A
performance claim with no number attached is noise, and a number you did not
observe is worse than no number.

## Targets

Field thresholds (what Google grades on, 75th percentile of real users):

| Metric | Good | Needs work | Poor |
|---|---|---|---|
| LCP — Largest Contentful Paint | ≤ 2.5s | 2.5–4.0s | > 4.0s |
| INP — Interaction to Next Paint | ≤ 200ms | 200–500ms | > 500ms |
| CLS — Cumulative Layout Shift | ≤ 0.1 | 0.1–0.25 | > 0.25 |

Lab numbers from Lighthouse on a dev build run hotter than field numbers. Treat
a lab pass as necessary, not sufficient, and say which kind you measured.

Budget for a marketing or landing page, on top of the metrics:

- First-load JS for the route: **≤ 200 kB gzipped**. Next.js prints this per
  route in the build output — that is a free measurement, always take it.
- Hero image: served in AVIF or WebP, sized to its container, `priority` set.
- Web fonts: at most two families, `font-display: swap`, preloaded if
  above the fold, subset to the characters actually used.

## How to measure

Cheapest first. Stop when you have a number.

**1. Build output (always available, zero setup).**

```bash
# Next.js — the per-route First Load JS table is the budget check
npm run build 2>&1 | tail -40
```

Flag any route whose First Load JS grew in this change, and by how much.

**2. Lighthouse against a running server.**

```bash
npx --yes lighthouse http://localhost:3000/<route> \
  --only-categories=performance \
  --preset=desktop \
  --output=json --output-path=./.lighthouse.json --quiet --chrome-flags="--headless"
node -e "const r=require('./.lighthouse.json');const a=r.audits;console.log(
  'perf', Math.round(r.categories.performance.score*100),
  '| LCP', a['largest-contentful-paint'].displayValue,
  '| CLS', a['cumulative-layout-shift'].displayValue,
  '| TBT', a['total-blocking-time'].displayValue)"
```

Run mobile too (`--preset=` omitted defaults to mobile emulation) — mobile is
where LCP actually fails.

**3. In-page, when a browser is driveable** (pairs with `visual-proof`):

```js
new PerformanceObserver(l => console.log('LCP', l.getEntries().at(-1).startTime))
  .observe({ type: 'largest-contentful-paint', buffered: true });
```

If none of these are possible — no dev server, no network, no Chromium — say
exactly that, list which of the static checks below you ran instead, and do not
produce a score.

## Static checks that need no browser

These are cheap greps and catch most real regressions:

- `<img>` without `width`/`height` → CLS risk
- `next/image` without `priority` on the LCP element, or with `priority` on
  below-fold images (which steals bandwidth from the real LCP)
- `loading="lazy"` missing on below-fold media
- a `'use client'` boundary sitting higher in the tree than it needs to
- third-party `<script>` without `strategy="lazyOnload"` / `defer`
- font `@import` in CSS (blocking) instead of `next/font` or a preload link
- `.map()` over an unbounded array with no virtualization
- animation on `width`, `height`, `top`, `left` instead of `transform`/`opacity`
- missing `<link rel="preconnect">` for an asset or media CDN

## Reporting

```
Route:        /<path>
Measured by:  next build | lighthouse (desktop|mobile) | not measured — <why>
First Load:   NNN kB  (was NNN kB, delta +/-NN)
LCP:          N.Ns    CLS: N.NN    TBT/INP: NNNms
Static:       <findings, or clean>
Verdict:      within budget | over budget on <metric> | unmeasured
```

If the verdict is "over budget," name the single largest contributor before
proposing fixes. Most pages have one dominant cause — an unoptimized hero, a
font waterfall, or one fat client component — and fixing it beats five small
optimizations.
