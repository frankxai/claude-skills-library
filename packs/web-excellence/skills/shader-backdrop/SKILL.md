---
name: shader-backdrop
description: Build a slow, token-coloured shader backdrop behind a headline — mesh gradient, grain gradient, or another Paper Shaders field — with a CSS poster underneath and a designed still. Use when someone asks for an animated gradient background, a mesh or aurora gradient, a grainy gradient hero, a moving background, or shares a ShaderGradient or shadergradient.co link; and when translating a ShaderGradient configuration into a lighter engine. Starts and ends in gpu-surface.
---

# Shader backdrop

A backdrop sets the temperature of a section and then stays out of the way.
This skill builds it from the repo's tokens with one fragment shader, a poster
that works without it, and a still chosen by eye.

Run `gpu-surface` section 1 first. Many taste files refuse a gradient that
carries no meaning; when the repo's does, the answer is a flat surface.

## 1. Choose the field

All of these come from `@paper-design/shaders-react` and share the same
`speed`, `frame`, and `maxPixelCount` props. The recipe below was rendered
with `MeshGradient` at `0.0.82`; read the props of any other in the installed
package's types before using it.

| Job | Component |
|---|---|
| Soft colour that drifts behind a headline | `MeshGradient` |
| The same with visible grain and harder shapes | `GrainGradient` |
| A designed gradient with no animation loop at all | `StaticMeshGradient`, `StaticRadialGradient` |
| Light from one edge | `GodRays` |
| Texture on a paper-like surface | `PaperTexture` |

Two to four colours, all tokens. When two of them are the page surface and
its neighbour, the backdrop reads as light on the page and the text keeps its
contrast.

## 2. Build

`use-surface.ts` is in `gpu-surface` section 3.

```tsx
// components/effects/MeshGradientLayer.tsx — the only file that imports the shader package
'use client'

import { MeshGradient, type MeshGradientProps } from '@paper-design/shaders-react'

export default function MeshGradientLayer(props: MeshGradientProps) {
  return <MeshGradient {...props} />
}
```

```tsx
// components/effects/ShaderSurface.tsx
'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import type { MeshGradientProps } from '@paper-design/shaders-react'
import { useGpu, useReducedMotion } from './use-surface'

const MeshGradientLayer = dynamic(() => import('./MeshGradientLayer'), { ssr: false })

type ShaderSurfaceProps = {
  colors: string[]
  stillFrame: number
  poster: string
  speed?: number
  className?: string
  children?: ReactNode
} & Pick<MeshGradientProps, 'distortion' | 'swirl' | 'grainMixer' | 'grainOverlay'>

export function ShaderSurface({ colors, stillFrame, poster, speed = 0.2, className = '', children, ...look }: ShaderSurfaceProps) {
  const reduced = useReducedMotion()
  const gpu = useGpu()
  return (
    <div className={className} style={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', background: poster }}>
      {gpu && (
        <MeshGradientLayer
          aria-hidden
          colors={colors}
          {...look}
          speed={reduced ? 0 : speed}
          frame={stillFrame}
          maxPixelCount={1920 * 1080}
          style={{ position: 'absolute', inset: 0, zIndex: -1 }}
        />
      )}
      {children}
    </div>
  )
}
```

```tsx
// in a route: the content is a child, so the headline stays the largest paint
<ShaderSurface
  colors={[tokens.surface, tokens.accentSoft, tokens.accent, tokens.surface2]}
  poster={`linear-gradient(135deg, ${tokens.surface}, ${tokens.accentSoft} 60%, ${tokens.accent})`}
  stillFrame={42000}
  speed={0.2}
  distortion={0.7}
  swirl={0.3}
  grainOverlay={0.15}
>
  <main>{/* headline and short copy only */}</main>
</ShaderSurface>
```

`className` carries size and placement only. The positioning stays inline
because the canvas sits at `z-index: -1` and must stay inside the wrapper's
stacking context.

Rendered in headless Chromium in three states with zero console errors:
moving, reduced motion (still at `stillFrame`), and WebGL switched off (poster
only, no canvas).

## 3. Tune

- **`poster`** is a CSS gradient of the same tokens in roughly the same
  arrangement as the still. A visitor without WebGL gets this and nothing
  else, so compare it to the still side by side.
- **`speed`** 0.1–0.3. If the motion is noticed before the headline is read,
  it is too fast.
- **`stillFrame`** is milliseconds. Export several and pick:
  `node .claude/skills/gpu-surface/export.mjs --url <route> --still 42000 --scale 1`.
  The exported still is also the section's Open Graph background.
- **`distortion`, `swirl`** shape the field; **`grainOverlay`** up to about
  0.2 adds texture without muddying text.
- **Contrast** is checked on the brightest region of the brightest frame.

## 4. From a ShaderGradient link

Do not install `@shadergradient/react` to reproduce a look from
shadergradient.co. `gpu-surface` section 2 has the measurements: about 25
times the JavaScript of this recipe, and version 2.4.20 renders a blank canvas
against `three@0.187.0`.

Translate the look instead:

| ShaderGradient setting | Here |
|---|---|
| `color1`, `color2`, `color3` | `colors`, replaced by the nearest tokens |
| `uSpeed` | `speed`, starting at half the value |
| `grain="on"` | `grainOverlay` 0.1–0.2, or `GrainGradient` |
| `uStrength`, `uDensity` | `distortion`, `swirl`, tuned by eye |
| `type="sphere"`, camera angles, `lightType="3d"` | No equivalent in a flat shader. If the look depends on the lit 3D form, it is an `r3f-scene` job and must earn that cost. |

## 5. Prove

`gpu-surface` section 4. The lab measurement for this recipe was +11.6 kB of
JavaScript transferred.

## Refusals

- A backdrop behind body copy or a form.
- Demo colours, or more than four colours.
- A backdrop on a page that already has a GPU surface.
- A gradient with no job, where the repo's taste file asks every gradient to
  carry meaning.
