---
name: r3f-scene
description: Build one React Three Fiber scene that loads late, stops rendering off-screen, holds a designed still under reduced motion, and falls back to a poster without WebGL. Use when a page needs real geometry, a camera, lights, a model, or 3D interaction; when someone shares three.js, react-three-fiber, drei, or Three.js Journey material and asks for the effect; or when reviewing or repairing an existing <Canvas> for cost. Starts and ends in gpu-surface.
---

# R3F scene

A 3D scene is the most expensive surface a page can carry: about 244 kB of
JavaScript transferred before the first model, and a render loop that runs
until something stops it. This skill builds the scene so the cost is paid late
and only while someone is looking.

Run `gpu-surface` section 1 first. The job sentence must need depth: an object
turned in the hand, a space moved through, a structure whose shape is the
point. A flat field of colour is a `shader-backdrop`.

## 1. Before installing

- `node .claude/skills/web-steward/peer-check.mjs --root .` As of 2026-11-12,
  `@react-three/fiber@9.8.2` declares `react >=19 <19.4` and
  `@react-three/drei@10.7.9` declares `react ^19`. A repo on React 18 with
  R3F 9 installed has an unmet peer: fix that first.
- `three`, `@react-three/fiber`, and `@types/three` move together. Pin them.
- Add `@react-three/drei` only for a helper the scene uses. Add
  postprocessing only when the job sentence names the effect.

## 2. Build

`use-surface.ts` is in `gpu-surface` section 3.

```tsx
// components/effects/SceneLayer.tsx
'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import type { Mesh } from 'three'

type SceneLayerProps = {
  /** Animate only while true: on screen and motion allowed. */
  running: boolean
  children: ReactNode
}

// The only file that imports three or @react-three/*: the whole 3D stack stays in this chunk.
export default function SceneLayer({ running, children }: SceneLayerProps) {
  return (
    <Canvas
      aria-hidden
      dpr={[1, 1.5]}
      frameloop={running ? 'always' : 'demand'}
      camera={{ position: [0, 0, 4.2], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {children}
    </Canvas>
  )
}

/** A scene takes time as a value, so the still is a moment someone chose. */
export function Knot({ color, running, stillTime }: { color: string; running: boolean; stillTime: number }) {
  const mesh = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const t = running ? stillTime + clock.elapsedTime : stillTime
    if (!mesh.current) return
    mesh.current.rotation.x = t * 0.25
    mesh.current.rotation.y = t * 0.4
  })
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <mesh ref={mesh}>
        <torusKnotGeometry args={[0.9, 0.3, 160, 24]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
      </mesh>
    </>
  )
}
```

```tsx
// components/effects/SceneSurface.tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useGpu, useReducedMotion } from './use-surface'

const SceneLayer = dynamic(() => import('./SceneLayer'), { ssr: false })
const Knot = dynamic(() => import('./SceneLayer').then((m) => m.Knot), { ssr: false })

type SceneSurfaceProps = {
  /** Painted before and without WebGL: an image of the still, or a token gradient. */
  poster: string
  /** Seconds into the motion. The reduced-motion render, and where the motion starts. */
  stillTime: number
  color: string
  className?: string
  children?: ReactNode
}

export function SceneSurface({ poster, stillTime, color, className = '', children }: SceneSurfaceProps) {
  const reduced = useReducedMotion()
  const gpu = useGpu('webgl')
  const box = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(false)

  // R3F keeps rendering off-screen. This stops the loop when the surface leaves the viewport.
  useEffect(() => {
    const node = box.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const running = onScreen && !reduced

  return (
    <div ref={box} className={className} style={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', background: poster }}>
      {gpu && (
        <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
          <SceneLayer running={running}>
            <Knot color={color} running={running} stillTime={stillTime} />
          </SceneLayer>
        </div>
      )}
      {children}
    </div>
  )
}
```

`Knot` stands in for the scene. Replace it and keep its three rules.

Measured in headless Chromium: the scene rendered 18 frames a second on
screen (software rendering), 0 after it scrolled out of view, and resumed on
return. Under reduced motion it rendered 3 frames in total and stopped. Zero
console errors in the moving, reduced-motion, and no-WebGL states.

## 3. The three rules of a scene component

1. **Time is a value.** Derive every animated property from `t`, as `Knot`
   does. Then `stillTime` is a moment someone chose, and the reduced-motion
   render is exactly that moment.
2. **`running` decides.** `frameloop` is `always` only while the scene is on
   screen and motion is allowed, and `demand` otherwise. R3F does not stop
   off-screen on its own; the `IntersectionObserver` in the wrapper does it.
3. **Nothing three-shaped leaves the leaf.** Only `SceneLayer.tsx` imports
   `three` or `@react-three/*`. Everything else reaches it through
   `next/dynamic`, so the 3D stack stays out of the route's first chunk.

## 4. Poster and still

- Choose `stillTime` by looking: load the route with reduced motion and adjust.
- Capture that state (`gpu-surface` probe, `--shots`), crop it, and use the
  image as `poster`, as a CSS `url()` over a token colour. A visitor without
  WebGL then still sees the object.
- Give the image explicit dimensions wherever it is used as an `<img>`.

## 5. Models and weight

- Compress geometry (Draco or Meshopt) and textures (KTX2 or WebP) before
  they enter the repo. Report the model's transferred size next to the
  JavaScript.
- Load models inside `Suspense` within the canvas; the poster covers the wait.
- `dpr={[1, 1.5]}` is the ceiling. A phone at 3× renders four times the
  pixels of 1.5× for a difference few people see.
- Interaction (orbit, drag) needs a keyboard path or must be decorative.

## 6. An existing canvas

For a scene already in the repo, check it against section 3 before changing
its look: is `three` imported outside one leaf, does the loop stop off-screen,
is there a reduced-motion branch, is there a poster. Run the probe on its
route first; its failures are the work list.

## 7. Prove

`gpu-surface` section 4. Report the JavaScript and the model weight together.

## Refusals

- A scene whose job a flat shader or an image does.
- A scene that keeps rendering off-screen or under reduced motion.
- A large object that delays or covers the page's primary action.
- A second canvas on the page, including a 3D logo in the header.
