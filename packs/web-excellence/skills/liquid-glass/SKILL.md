---
name: liquid-glass
description: Build glass panels on the web in tiers, with an opaque fallback and reduced-transparency support. Tier one is CSS backdrop-filter; tier two adds an SVG displacement filter as a Chromium-only refraction upgrade. Use when someone asks for liquid glass, glassmorphism, frosted glass, an Apple-style glass nav, card, or button, a refraction or lens effect over content, or shares dashersw/liquid-glass-js or the npm package liquid-glass-js. No canvas and no JavaScript dependency. Starts in gpu-surface section 1 for the taste check.
---

# Liquid glass

Glass is a surface that shows what is behind it. This skill builds it with the
browser's compositor, so it costs no JavaScript and no WebGL context and does
not count as the page's GPU surface.

Run `gpu-surface` section 1 first, with two checks specific to glass:

- **Something worth seeing is underneath**: an image, a backdrop, content
  that scrolls behind a bar. Glass over a flat colour is a grey box.
- **The repo may already have its glass.** When `design.md` gives one glass
  recipe, use that recipe and stop. A second set of opacity values is how a
  site drifts.

## 1. Tier one — CSS

```tsx
// components/effects/GlassPanel.tsx — a server component; there is no client code
import type { CSSProperties, ReactNode } from 'react'

type GlassPanelProps = {
  /** Token colour of the surface the panel falls back to. */
  surface: string
  /** 0–1: how much of the surface colour stays over the blur. */
  tint?: number
  blur?: number
  radius?: number
  /** Chromium-only upgrade: bend what is behind the panel. Other browsers keep the blur. */
  refract?: boolean
  className?: string
  children?: ReactNode
}

export function GlassPanel({ surface, tint = 0.55, blur = 14, radius = 20, refract = false, className = '', children }: GlassPanelProps) {
  const vars = {
    '--glass-surface': surface,
    '--glass-tint': `${Math.round(tint * 100)}%`,
    '--glass-blur': `${blur}px`,
    '--glass-radius': `${radius}px`,
  } as CSSProperties
  return (
    <div className={`glass-panel ${refract ? 'glass-panel--refract' : ''} ${className}`} style={vars}>
      {children}
    </div>
  )
}

/** Render once per page, only where a panel sets `refract`. */
export function GlassLens({ scale = 28 }: { scale?: number }) {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
      <filter id="glass-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
```

```css
/* glass.css */
.glass-panel {
  border-radius: var(--glass-radius);
  /* Without backdrop-filter this is the whole effect: an opaque token surface. */
  background: var(--glass-surface);
  border: 1px solid color-mix(in srgb, var(--glass-surface) 60%, white);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.45), 0 12px 32px rgb(0 0 0 / 0.12);
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .glass-panel {
    background: color-mix(in srgb, var(--glass-surface) var(--glass-tint), transparent);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.5);
    backdrop-filter: blur(var(--glass-blur)) saturate(1.5);
  }
}

/* SVG filters inside backdrop-filter render in Chromium only. Safari and Firefox drop the whole declaration, so it is gated. */
@supports (backdrop-filter: url('#glass-lens')) {
  .glass-panel--refract {
    backdrop-filter: url('#glass-lens') blur(calc(var(--glass-blur) / 3)) saturate(1.5);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-panel,
  .glass-panel--refract {
    background: var(--glass-surface);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
```

The order matters. The base rule is an opaque token surface, so a browser
without `backdrop-filter` gets a solid panel with readable text. The
translucent version is added only where the browser supports it.
`prefers-reduced-transparency: reduce` returns to the opaque panel.

Pass `surface` as a token. `tint` is how much of that colour stays over the
blur: raise it until text passes contrast over the brightest thing that can
scroll behind the panel.

## 2. Tier two — refraction

Set `refract` on a panel and render `<GlassLens />` once on the page. An SVG
displacement map bends the backdrop instead of only blurring it.

- This rendered in headless Chromium. Safari and Firefox were not available
  in the session that wrote this recipe, so their behaviour is untested. The
  rule sits behind `@supports`, so a browser that rejects it keeps tier one.
  Test both on a device before shipping tier two.
- One lens per page, on the panel that is the focus. Refraction on every card
  is noise.
- `scale` on `GlassLens` is the strength in pixels; 20–30 reads as glass,
  more reads as water.

## 3. Glass over a GPU surface

A glass panel over a `shader-backdrop` or an `r3f-scene` is the one
combination where two of these recipes meet on a page, and it is allowed: the
panel is CSS, so the page still has one canvas. Check contrast on the
brightest frame, and keep the panel off the moving area's most active region.

## 4. Why not `liquid-glass-js`

Findings from running `dashersw/liquid-glass-js` at commit `78cb6ccb0b99`
(MIT, last commit 2025-06-12) on 2026-11-12:

- It is not on npm. The npm package named `liquid-glass-js` is a different
  project by a different author. It installs as copied script files that
  define globals.
- It needs `html2canvas`, takes one snapshot of `document.body`, and refracts
  that picture. Anything that changes behind the glass afterwards is not in it.
- Each glass element opens its own WebGL context: a container with one button
  measured two. A nav with five buttons would open six, against a cap of one
  GPU surface per page.
- Without WebGL it logs a console error.

Use its demo as a visual reference for the refraction look. Build with the
tiers above.

## 5. Prove

`web-release-gate` phases 4 and 5. Run `gpu-surface`'s probe as well: it
should report no GPU canvas and no console errors. Add:

- a screenshot with `backdrop-filter` unsupported or reduced transparency on
  (the opaque panel), next to the glass one
- contrast of the panel's text over the brightest backdrop region

## Refusals

- Glass over a flat colour.
- A second glass recipe in a repo that already defines one.
- Stacks of glass cards with nothing behind them.
- A WebGL or screenshot-based glass library in production.
