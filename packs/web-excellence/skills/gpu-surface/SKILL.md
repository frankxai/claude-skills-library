---
name: gpu-surface
description: Decide on, build, and prove one GPU-rendered surface on a web page — a WebGL shader background (mesh gradient, grain, liquid metal on a logo, fluted glass) or a React Three Fiber scene. Use when a task adds, changes, or reviews a canvas, shader, or 3D element; when someone shares a ShaderGradient, Paper Shaders, Liquid Logo, Liquid Glass, three.js, or react-three-fiber link and asks for the effect; or before installing @paper-design/shaders-react, @react-three/fiber, three, or a similar package. Checks the repo's taste rules first, picks the lightest engine, and defines the wrapper, the reduced-motion still, the budget, and the proof. Runs inside web-release-gate phase 3.
---

# GPU surface

A shader or a 3D scene is the loudest thing a page can carry. It costs a
second WebGL context, a JavaScript chunk, battery on a phone, and attention.
This skill decides whether the page earns it, then builds it so the still
version is as considered as the moving one.

## 1. Earn it — before any install

1. **Read the repo's rules.** In `taste.md`, `design.md`, and `TASTE.md`/`DESIGN.md`,
   search for gradient, glass, 3D, WebGL, canvas, motion, and set-piece. When
   a line refuses the effect, stop and quote it. A tutorial recommending the
   effect does not outrank the repo.
2. **One GPU surface per page.** Count what the route already renders:
   `grep -rnE "<Canvas|ShaderMount|@paper-design/shaders|@react-three/fiber" app components`,
   then follow the imports into the route. When one exists, the new surface
   replaces it or does not ship. When the repo caps scroll set-pieces at one
   per page, a GPU hero counts toward that cap too.
3. **Name its job in one sentence.** For example, it frames the product, carries the
   brand mark, or shows a state change. "Makes it look premium" is not a job.
4. **Try the static version first.** A token-coloured CSS gradient, an
   optimised image, or an exported SVG noise texture costs no JavaScript and no
   GPU. When the static version does the job, ship that and stop here.

## 2. Pick the engine

| Need | Use | Why |
|---|---|---|
| Moving gradient, grain, noise, god rays, liquid metal on a logo, glass distortion over an image | `@paper-design/shaders-react` | One fragment shader on one canvas, no three.js. It pauses itself when off-screen and when the tab is hidden. `Static*` variants exist. |
| Real geometry, camera, lights, models, or 3D interaction | `@react-three/fiber` + `@react-three/drei` | A full scene graph, and the heaviest option. Only when the job needs depth. |
| Frosted glass panels over DOM content | CSS `backdrop-filter` first | A refraction library only when the brand file asks for refraction. The npm package named `liquid-glass-js` is not the `dashersw/liquid-glass-js` repository. |
| ShaderGradient | Prefer Paper's `MeshGradient` or `GrainGradient` | As of 2026-10-20, `@shadergradient/react` was last published 2025-12-08 and runs on the three.js stack for what Paper does in a single shader. |

Before installing:

- **Check peers.** Run `node .claude/skills/web-steward/peer-check.mjs --root .`.
  R3F 9 and drei 10 declare React 19 peers. On React 18, either move to R3F 8
  or upgrade React first (a `web-steward` job). Do not install over an unmet peer.
- **Pin `0.x` packages exactly** (`pnpm add -E` / `npm i -E`). Paper Shaders is
  0.0.x, where any release may change behaviour.

## 3. Build — the wrapper contract

Every surface goes through one wrapper under `components/effects/`, so there is
one place to audit, budget, and swap engines. The contract:

- **Client-only and late.** Load it with `next/dynamic` and `{ ssr: false }`.
  Use a static named import inside a leaf module, so the package tree-shakes to
  the one shader in use.
- **A poster underneath.** The container paints a token colour or a CSS
  gradient, so the page looks intentional at first paint, before WebGL, and
  without WebGL. The canvas is `aria-hidden`.
- **Check for WebGL2 first.** Without WebGL2, Paper throws inside an effect,
  which leaves a console error. Check and skip, so the poster stays and the
  console stays clean.
- **An art-directed still.** Under `prefers-reduced-motion: reduce`, render
  `speed={0}` at a chosen `frame`. Pick the frame by looking at it; it is the
  version a reduced-motion reader gets, so design it instead of accepting frame 0.
- **Token colours only.** Read them from `design.md` or the Tailwind config,
  never from the library's demo presets.
- **Slow and readable.** Start at `speed` 0.1–0.3. Text over the surface must
  pass contrast on its brightest frame, not its average one.
- **A pixel ceiling.** Set `maxPixelCount` (Paper's default allows 1920×1080×4).
  For R3F, pass `dpr={[1, 1.5]}` and `frameloop="demand"` unless the scene must
  animate continuously. R3F does not pause off-screen on its own.

Reference implementation for Paper. LiquidMetal, GrainGradient, and FlutedGlass
follow the same shape:

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
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { MeshGradientProps } from '@paper-design/shaders-react'

// Never rendered on the server and loaded after hydration, so it cannot hold up first paint.
const MeshGradientLayer = dynamic(() => import('./MeshGradientLayer'), { ssr: false })

const REDUCED = '(prefers-reduced-motion: reduce)'

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// Paper throws inside an effect when WebGL2 is missing; checking first keeps the poster and a clean console.
function hasWebGL2() {
  const gl = document.createElement('canvas').getContext('webgl2')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  return Boolean(gl)
}

type ShaderSurfaceProps = {
  /** Token values only. */
  colors: string[]
  /** Shown under reduced motion, and the frame the animation starts from. */
  stillFrame: number
  /** Painted before and without WebGL: a token colour or a CSS gradient. */
  poster: string
  speed?: number
  className?: string
  children?: ReactNode
} & Pick<MeshGradientProps, 'distortion' | 'swirl' | 'grainMixer' | 'grainOverlay'>

export function ShaderSurface({
  colors,
  stillFrame,
  poster,
  speed = 0.2,
  className = '',
  children,
  ...look
}: ShaderSurfaceProps) {
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true)
  const [gpu, setGpu] = useState(false)
  useEffect(() => setGpu(hasWebGL2()), [])

  // Inline, not utility classes: the canvas sits at z-index -1 and must stay inside this stacking context.
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

`className` carries size and placement only. Keep the inline positioning and
the behaviour. This shape was type-checked against Next 16 and
`@paper-design/shaders-react@0.0.81` and rendered in headless Chromium in three
states: animated (canvas moving), reduced motion (canvas still at the chosen
frame), and WebGL disabled (no canvas, poster shown). All three left zero
console errors.

## 4. Prove

Run inside `web-release-gate` phases 4 and 5, plus:

- `visual-proof` after-shots at 375 / 768 / 1440, light and dark, then again
  with `--reduced-motion --label after-reduced`. Open the reduced shots; the
  still must tell the same story.
- `core-web-vitals`: the route's first-load JS before and after, read from the
  build output. The canvas must not be the LCP element; the headline stays it.
- Contrast of text over the brightest frame.
- A real phone if one is available; otherwise write "not tested on a device".

Add this line to the gate's "Done means" block:

```
GPU:  <engine>@<exact version> on <route> — job: <one sentence>; still frame <n>;
      first-load JS <before> → <after>; reduced-motion shots <path>; device: <tested | not tested>
```

## Refusals

- A second GPU surface on the same page.
- A moving surface behind body copy. Headlines and short labels only, at
  passing contrast.
- An effect the repo's taste file refuses, whoever recommends it.
- A library's demo palette instead of the repo's tokens.
- A WebGL dependency for something a CSS gradient, an image, or an SVG already does.
