---
name: gpu-surface
description: Decide on, budget, and prove one GPU-rendered surface on a web page — a shader backdrop, liquid metal on a logo, a glass panel, or a React Three Fiber scene. Use when a task adds, changes, or reviews a canvas, shader, or 3D element; when someone shares a ShaderGradient, Paper Shaders, Liquid Logo, Liquid Glass, three.js, or react-three-fiber link and asks for the effect; or before installing @paper-design/shaders-react, @react-three/fiber, three, or a similar package. Checks the repo's taste rules first, picks the lightest engine, hands the build to the matching recipe skill (liquid-logo, shader-backdrop, liquid-glass, r3f-scene), and runs the probe that proves the result. Runs inside web-release-gate phase 3.
---

# GPU surface

A shader or a 3D scene is the loudest thing a page can carry. It costs a
WebGL context, a JavaScript chunk, battery on a phone, and attention. This
skill decides whether the page earns it, sends the build to the recipe for
that engine, and proves the result in the three states it must survive.

The four recipe skills build. This skill governs: every one of them starts at
section 1 here and ends at section 4.

## 1. Earn it — before any install

1. **Read the repo's rules.** In `taste.md`, `design.md`, and `TASTE.md`/`DESIGN.md`,
   search for gradient, glass, 3D, WebGL, canvas, motion, and set-piece. When
   a line refuses the effect, stop and quote it. A tutorial recommending the
   effect does not outrank the repo.
2. **One GPU surface per page.** Count what the route already renders:
   `grep -rnE "<Canvas|ShaderMount|@paper-design/shaders|@react-three/fiber" app components`,
   then follow the imports into the route. When one exists, the new surface
   replaces it or does not ship. When the repo caps scroll set-pieces at one
   per page, a GPU hero counts toward that cap too. A canvas in the header or
   footer is on every page, so it uses up every page's surface: put an
   exported still there instead (`liquid-logo` section 5).
3. **Name its job in one sentence.** For example, it frames the product, carries the
   brand mark, or shows a state change. "Makes it look premium" is not a job.
4. **Try the static version first.** A token-coloured CSS gradient, an
   optimised image, or an exported SVG noise texture costs no JavaScript and no
   GPU. When the static version does the job, ship that and stop here.

When the site has a Material block and a surface map (`material-system`), read
them here: the map already says which route holds the surface and why.

## 2. Pick the engine

Costs are JavaScript transferred over a static route, measured with `probe.mjs`
on 2026-11-12 against Next 16.4.5 and React 19.3.1. Measure your own route;
these show the order of magnitude.

| Need | Use | Cost | Recipe |
|---|---|---|---|
| The brand mark in liquid metal | `LiquidMetal` from `@paper-design/shaders-react` | +15 kB | `liquid-logo` |
| Moving gradient, grain, noise, god rays behind a headline | `MeshGradient` and siblings from `@paper-design/shaders-react` | +12 kB | `shader-backdrop` |
| Frosted or refracting panels over content | CSS `backdrop-filter`; an SVG displacement filter as a Chromium-only upgrade | 0 kB, no canvas | `liquid-glass` |
| Real geometry, camera, lights, models, or 3D interaction | `@react-three/fiber` + `three` | +244 kB before any model | `r3f-scene` |

Paper Shaders draws one fragment shader on one canvas with no three.js, pauses
itself off-screen and in a hidden tab, and ships `Static*` variants. That is
why it is the default for everything flat.

Two libraries from the same tutorials that this pack does not build with:

- **`@shadergradient/react`.** It runs a three.js scene for what Paper does in
  one shader: +285 kB in the same measurement. Version 2.4.20 (published
  2025-12-08) imports the host's `three` without declaring it as a peer, and
  against `three@0.187.0` its shader fails to compile
  (`Can not resolve #include <cube_uv_reflection_fragment>`), so the canvas
  stays blank. `shader-backdrop` section 4 translates a ShaderGradient look
  into Paper settings.
- **`dashersw/liquid-glass-js`.** `liquid-glass` section 4 has the findings;
  the npm package named `liquid-glass-js` is a different project.

Before installing:

- **Check peers.** Run `node .claude/skills/web-steward/peer-check.mjs --root .`.
  R3F 9 and drei 10 declare React 19 peers. On React 18, either move to R3F 8
  or upgrade React first (a `web-steward` job). Do not install over an unmet peer.
- **Pin `0.x` packages exactly** (`pnpm add -E` / `npm i -E`). Paper Shaders is
  0.0.x, where any release may change behaviour.

## 3. Build — the wrapper contract

Every surface goes through one wrapper under `components/effects/`, so there is
one place to audit, budget, and swap engines. Each recipe skill carries a
wrapper that meets this contract:

- **Client-only and late.** Load it with `next/dynamic` and `{ ssr: false }`.
  Use a static named import inside a leaf module, so the package tree-shakes to
  the one shader in use and the engine stays out of the route's first chunk.
- **A poster underneath.** The container paints a token colour, a CSS
  gradient, or the flat mark, so the page looks intentional at first paint,
  before WebGL, and without WebGL. The canvas is `aria-hidden`.
- **Check for the context first.** Without WebGL2, Paper throws inside an
  effect, which leaves a console error. Check and skip, so the poster stays
  and the console stays clean.
- **An art-directed still.** Under `prefers-reduced-motion: reduce`, render the
  surface stopped at a chosen moment. Pick the moment by looking at it; it is
  the version a reduced-motion reader gets, so design it instead of accepting
  frame 0.
- **Token colours only.** Read them from `design.md` or the Tailwind config,
  never from the library's demo presets.
- **Slow and readable.** Text over the surface must pass contrast on the
  brightest frame the surface can show.
- **A pixel ceiling.** Set `maxPixelCount` on a Paper shader (its default
  allows 1920×1080×4). R3F gets `dpr={[1, 1.5]}` and a loop that stops
  off-screen; it does not pause on its own.

The recipes share two hooks. Create this file once per site:

```ts
// components/effects/use-surface.ts
'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** True on the server and under prefers-reduced-motion: the still is the default, motion is the upgrade. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true)
}

/** False until the browser proves it has the context. The poster stays when it does not. */
export function useGpu(kind: 'webgl2' | 'webgl' = 'webgl2') {
  const [gpu, setGpu] = useState(false)
  useEffect(() => {
    const gl = document.createElement('canvas').getContext(kind) as WebGLRenderingContext | null
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    setGpu(Boolean(gl))
  }, [kind])
  return gpu
}
```

## 4. Prove

Run inside `web-release-gate` phases 4 and 5, plus the probe:

```bash
node .claude/skills/gpu-surface/probe.mjs --url http://localhost:3000/<route> \
  --baseline http://localhost:3000/<a route with no surface> --shots .visual-proof/gpu
```

It loads the page with motion, with reduced motion, and with WebGL and WebGPU
switched off. Exit 0 means all five hold: at most one canvas with a GPU
context, no movement under reduced motion, no console error in any state, no
canvas left attached without a GPU, and the canvas is not the largest
contentful paint. It also prints the JavaScript the page transferred against
the baseline. Next 16's Turbopack build prints no per-route sizes, so this is
the number to report.

The probe proves the states exist. Looking at them is still yours:

- Open the three `--shots` images. The reduced-motion still and the no-GPU
  poster must tell the same story as the moving version.
- `visual-proof` after-shots at 375 / 768 / 1440, light and dark, then again
  with `--reduced-motion --label after-reduced`.
- Contrast of text over the brightest frame.
- A real phone if one is available; otherwise write "not tested on a device".

Add this line to the gate's "Done means" block:

```
GPU:  <engine>@<exact version> on <route> — job: <one sentence>; still <frame or time>;
      probe: <exit code>, JS <baseline> → <with surface>; shots <path>; device: <tested | not tested>
```

## Refusals

- A second GPU surface on the same page, a header or footer canvas included.
- A moving surface behind body copy. Headlines and short labels only, at
  passing contrast.
- An effect the repo's taste file refuses, whoever recommends it.
- A library's demo palette instead of the repo's tokens.
- A WebGL dependency for something a CSS gradient, an image, or an SVG already does.
