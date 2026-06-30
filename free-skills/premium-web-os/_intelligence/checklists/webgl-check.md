# WebGL / 3D Check

> Run only when a scene ships 3D. Verifies the scene is a brand metaphor with a declared budget and complete fallbacks, per [`../three-webgl.md`](../three-webgl.md). No metaphor or no fallback = no ship.

## Metaphor declared

- [ ] 3D represents a brand metaphor (intelligence core / orbital system / portal / signal field / glass monolith / constellation / luxury object / data sculpture) — not a decorative blob.
- [ ] If the idea isn't a metaphor for the brand's substance, it was cut.

## Per-scene spec complete

- [ ] Metaphor — what it represents.
- [ ] Camera behavior — static / drift / scroll-driven.
- [ ] Lighting — key / rim / environment named.
- [ ] Material language — glass / metal / emissive / etc.
- [ ] Object count — explicit cap.
- [ ] Performance budget — target fps, DPR cap, draw calls, particle ceiling.
- [ ] Fallback image — static poster path.
- [ ] Mobile behavior — simplified scene or poster.
- [ ] Reduced-motion behavior — frozen frame or poster.

## Budget enforced in code

- [ ] DPR capped: `<Canvas dpr={[1, 2]}>` (lower on mobile).
- [ ] Particle/object counts bounded to the declared ceiling — no unbounded counts.
- [ ] `useFrame` loops minimal; no per-frame allocations.
- [ ] Large geometry avoided; GLB compressed (draco/meshopt).

## Lifecycle + leaks

- [ ] Geometries, materials, and textures disposed on unmount.
- [ ] No memory leak on route change (verified by navigating away and back).
- [ ] WebGL isolated in `components/visuals/`/`components/web-os/`, out of server components.

## Lazy-load

- [ ] Heavy 3D lazy-loaded: `dynamic(() => import(...), { ssr: false, loading: () => <Poster/> })`.
- [ ] Scene contents wrapped in `<Suspense fallback={...}>`.
- [ ] Loading state shows the poster, not a spinner on blank.

## Fallbacks (mandatory)

- [ ] Static poster fallback present — and it doubles as the LCP image.
- [ ] Mobile simplification present (simplified scene or poster).
- [ ] Reduced-motion frozen state present.
- [ ] No focus trap inside the canvas; a text/poster alternative exists for the scene.

## Postprocessing discipline

- [ ] No heavy postprocessing on mobile.
- [ ] Any postprocessing (bloom / noise / vignette / DoF / tiny chromatic aberration) is added lazily and recorded in [`../decision-log.md`](../decision-log.md).
- [ ] `postprocessing`/`lenis` confirmed in `package.json` if used; API verified from the installed version, not memory.
