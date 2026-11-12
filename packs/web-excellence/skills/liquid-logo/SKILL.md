---
name: liquid-logo
description: Render a brand mark in liquid metal on the web, and export the same mark as a still and a loop. Use when someone asks for a liquid metal, chrome, or molten logo; shares liquid.paper.design or the paper-design/liquid-logo repository; wants an animated logo for a hero, a loader, a brand page, an Open Graph image, or a social clip; or asks to tune the metal's colour, refraction, or speed to the brand. Builds one wrapper around the LiquidMetal shader from @paper-design/shaders-react with the flat mark as its fallback, then exports frames by number. Starts and ends in gpu-surface.
---

# Liquid logo

One shader turns the outline of a mark into moving metal. This skill prepares
the mark, builds the one place it runs live, and exports a still and a loop
for everywhere else.

The vector logo stays the identity. The metal version is an application of it,
like an embossed business card: use it where the brand is the subject.

Run `gpu-surface` section 1 first. Its answer may be "the flat mark is enough".

## 1. Which code to use

Use the `LiquidMetal` component from `@paper-design/shaders-react`
(Apache-2.0). Pin it exactly; this recipe was built and rendered against
`0.0.82`.

Do not copy code from the `paper-design/liquid-logo` repository. It is the
source of the hosted tool at liquid.paper.design, its licence is PolyForm
Shield 1.0.0 (read at commit `689bb38a1e0d` on 2026-11-12), and it pins
`@paper-design/shaders-react@0.0.21`. The hosted tool is useful for trying
settings on a mark. Carry over the numbers it shows and write the component
from this recipe.

## 2. Prepare the mark

The shader reads one thing from the image: which pixels have any opacity.
Colour is ignored.

- **SVG or transparent PNG, served from the site's own origin.** The shader
  loads it with `crossOrigin = "anonymous"`.
- **Holes are transparency.** A counter drawn in white is part of the shape
  and fills with metal. Cut it out of the path.
- **One silhouette.** Thin strokes and small text lose the effect; the metal
  needs area to move across. Use the symbol on its own; leave the wordmark flat.
- **Square artboard with padding** of about 8% a side, so the edge distortion
  has room.
- The shader prepares the image in the browser when it mounts. The wrapper
  shows the flat mark until that finishes.

## 3. Build

`use-surface.ts` is in `gpu-surface` section 3.

```tsx
// components/effects/LiquidMetalLayer.tsx — the only file that imports the shader package
'use client'

import { LiquidMetal, type LiquidMetalProps } from '@paper-design/shaders-react'

export default function LiquidMetalLayer(props: LiquidMetalProps) {
  return <LiquidMetal {...props} />
}
```

```tsx
// components/effects/LiquidMark.tsx
'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { LiquidMetalProps } from '@paper-design/shaders-react'
import { useGpu, useReducedMotion } from './use-surface'

const LiquidMetalLayer = dynamic(() => import('./LiquidMetalLayer'), { ssr: false })

type LiquidMarkProps = {
  /** Same-origin SVG or transparent PNG of the mark. */
  src: string
  /** The mark is content: this is its accessible name. */
  label: string
  /** CSS size of the square the mark sits in. */
  size: number | string
  /** Token values: the metal's base and its tint. */
  colorBack: string
  colorTint: string
  /** Milliseconds into the animation. Shown under reduced motion; the loop and the still start here. */
  stillFrame: number
  speed?: number
} & Pick<LiquidMetalProps, 'repetition' | 'softness' | 'shiftRed' | 'shiftBlue' | 'distortion' | 'contour' | 'angle'>

export function LiquidMark({ src, label, size, colorBack, colorTint, stillFrame, speed = 0.6, ...look }: LiquidMarkProps) {
  const reduced = useReducedMotion()
  const gpu = useGpu()
  // The flat mark is the server render, the no-WebGL render, and the fallback while the shader prepares the image.
  const flat = <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />

  return (
    <span role="img" aria-label={label} style={{ position: 'relative', display: 'inline-block', width: size, aspectRatio: '1' }}>
      {gpu ? (
        <Suspense fallback={flat}>
          <LiquidMetalLayer
            aria-hidden
            image={src}
            suspendWhenProcessingImage
            shape="none"
            fit="contain"
            scale={1}
            colorBack={colorBack}
            colorTint={colorTint}
            {...look}
            speed={reduced ? 0 : speed}
            frame={stillFrame}
            maxPixelCount={1024 * 1024}
            style={{ position: 'absolute', inset: 0 }}
          />
        </Suspense>
      ) : (
        flat
      )}
    </span>
  )
}
```

The flat mark is the server render, the no-WebGL render, and the fallback
while the image is prepared, so the mark is visible at first paint in every
case. The wrapper carries the accessible name; the canvas and the fallback
image are hidden from it.

Rendered in headless Chromium in three states with zero console errors:
moving, reduced motion (still at `stillFrame`), and WebGL switched off (flat
mark, no canvas).

## 4. Tune

Set `colorTint` to the brand's accent token and leave `colorBack` transparent
(`#00000000`) so the mark sits on the page's own surface.

| Prop | Range | What it changes | Start |
|---|---|---|---|
| `colorTint` | colour | The metal's hue, applied as a colour burn | accent token |
| `colorBack` | colour | What is behind the mark | `#00000000` |
| `repetition` | 1–10 | How many bands cross the mark | 2 |
| `softness` | 0–1 | Band edges: 0 hard, 1 smooth | 0.1 |
| `shiftRed`, `shiftBlue` | −1–1 | Colour fringing at band edges | 0.25, 0.1 |
| `distortion` | 0–1 | Noise in the bands | 0.07 |
| `contour` | 0–1 | How strongly the bands bend at the mark's edge | 0.4 |
| `angle` | 0–360 | Direction the bands travel | 70 |
| `speed` | number | Time multiplier; negative runs backwards | 0.6 |

Lower `shiftRed` and `shiftBlue` toward 0 for a sober metal; raise them for a
prismatic one. Choose `stillFrame` by exporting several and looking:

```bash
for f in 0 1600 3200 4800 6400; do
  node .claude/skills/gpu-surface/export.mjs --url http://localhost:3000/<route> --still $f --out .gpu-export
done
```

## 5. Place

- **One live placement per page**, and it is that page's GPU surface: a hero,
  a brand page, a loader, a 404.
- **Header and footer get the exported still**, as an image. A live canvas
  there would run on every page and take every page's surface.
- **Never the only logo on the page.** Assistive technology and print get the
  flat mark.

## 6. Export

`frame` is milliseconds into the animation, and the same number draws the same
pixels on every machine. Export with the `stillFrame` the site uses, and the
site's reduced-motion render, the exported still, and the loop's first frame
are one picture.

```bash
# A still: Open Graph image, favicon source, header mark, print.
node .claude/skills/gpu-surface/export.mjs --url http://localhost:3000/<route> --still 3200 --scale 4

# A loop: pass the component's speed so the export moves as the site does.
node .claude/skills/gpu-surface/export.mjs --url http://localhost:3000/<route> \
  --loop --from 3200 --seconds 4 --speed 0.6 --pingpong --background '#<page surface token>'
```

It writes `.gpu-export/still-<frame>.png`, a PNG sequence, and with ffmpeg on
PATH `loop.webm` (alpha kept, for a `<video>` on the site) and `loop.mp4`
(flattened onto `--background`, for social platforms). `--pingpong` plays out
and back so the loop has no cut; without it the last frame jumps to the first.
Add `.gpu-export/` to `.gitignore` and commit only the files the site serves.

Generated media goes through the repo's own asset review before it is
published.

## 7. Prove

`gpu-surface` section 4, on the route that carries the live mark. The lab
measurement for this recipe was +15.0 kB of JavaScript transferred.

## Refusals

- A live mark in the header, footer, or any component rendered on every page.
- Replacing the vector logo in the brand files with a render.
- Metal colours picked from the demo instead of the repo's tokens.
- A full lockup with small text run through the shader.
- Code copied from the `liquid-logo` repository.
