# 3D / WebGL System

**3D must be a brand metaphor, not decoration.** Use it only when it creates memorability, spatial identity, a product metaphor, cinematic authority, or scroll narrative. Never floating blobs.

This file codifies patterns proven in shipped components: an R3F hero scene (Stars/Float/useFrame/multi-light) and a raw-shader audio-reactive orb (custom GLSL uniforms). Reuse these, don't reinvent.

## Approved 3D metaphors

intelligence core · orbital system · portal/codex · command interface · signal field · glass monolith · constellation map · architectural room/interior · luxury product object · data sculpture.

If your 3D idea isn't a metaphor for the brand's substance, cut it.

## Every WebGL scene must declare

A scene without this spec does not get built (use `templates/motion-spec.template.md`):

- **Metaphor** — what it represents.
- **Camera behavior** — static / drift / scroll-driven progression.
- **Lighting** — key/rim/environment.
- **Material language** — glass/metal/emissive/etc.
- **Object count** — explicit cap.
- **Performance budget** — target fps, DPR cap, draw calls, particle ceiling.
- **Fallback image** — static poster path.
- **Mobile behavior** — simplified scene or poster.
- **Reduced-motion behavior** — frozen frame or poster.

## React Three Fiber rules

- Isolate WebGL in `components/visuals/` (or `components/web-os/` for this build). Keep it out of server components.
- **Lazy-load** heavy 3D: `dynamic(() => import(...), { ssr: false, loading: () => <Poster/> })`.
- Wrap scene contents in `<Suspense fallback={...}>`.
- Cap DPR: `<Canvas dpr={[1, 2]}>`; lower on mobile.
- Avoid massive geometry; compress GLB (draco/meshopt). Avoid unbounded particle counts — declare the ceiling.
- Keep `useFrame` loops minimal; avoid per-frame allocations. Dispose geometries/materials/textures on unmount.
- Tie scroll to state carefully — one source of scroll truth (see `motion.md`).

## Lighting & material (premium 3D is mostly light)

Prefer rim light, soft environment light, selective bloom, dark atmosphere, subtle volumetric illusion. Avoid flat front lighting, overexposed bloom, rainbow lighting, toy-like plastic materials.

## Postprocessing rules

Use sparingly and **lazily** (the `postprocessing` lib is only added when a scene needs it — record the addition in `decision-log.md`): bloom, subtle noise, vignette, gentle depth-of-field, chromatic aberration at tiny amounts only. No heavy postprocessing on mobile.

## Fallback rules (mandatory)

Every 3D hero ships with: a static poster fallback (also the LCP image), a mobile simplification, a reduced-motion frozen state, and a loading state that does not look broken (poster, not a spinner on blank). If you can't produce the fallback, you can't ship the 3D.

## Generated 3D (GLB) — the "real 3D at the core" path

Procedural geometry is right when the metaphor is generative (constellation, signal field). When the hero is a *brand object* (a core, monolith, product), use a **generated GLB** instead — see [`visuals.md`](./visuals.md).

- **Produce:** Higgsfield `generate_3d` from a lane-routed concept still → a `.glb` mesh; gate it (council + brand) before committing.
- **Wire:** `useGLTF('/models/<name>.glb')` + drei inside the isolated, lazy R3F scene. Draco/meshopt-compress the GLB; `useGLTF.preload` only the above-fold one; dispose on unmount.
- **Fallbacks (mandatory, same as procedural):** static poster (the LCP), mobile simplification, reduced-motion frozen frame. If the GLB isn't generated yet, fall back to procedural or the poster and mark it `pending` in the asset manifest — never block the build.

## Generated hero video

When the hero must *move*, a generated video can beat WebGL. Use Higgsfield `generate_video` (lane-routed), then wire a poster-disciplined `<video>` — full rules in [`performance.md`](./performance.md). The poster is the LCP; reduced-motion and mobile fall back to it.

## Dependency honesty

`three`, `@react-three/fiber`, `@react-three/drei` are commonly present — verify versions in `package.json`. `postprocessing` and `lenis` are often **not** present; add only with justification and lazy usage. Never code against an API from memory — confirm from the installed version.

## WebGL QA

fps target met on mid hardware · DPR capped · memory disposed (no leak on route change) · mobile path verified · reduced-motion path verified · fallback poster present · metaphor is legible. Full: `checklists/webgl-check.md`.
