# Visual / Asset Production

Generated assets — imagery, **3D models, and video** — are first-class in a premium build, not an afterthought. This is the stage that was missing: a page is only as premium as its hero asset, and a procedural placeholder is a placeholder. This doc binds the OS to the asset systems that already exist; it does **not** reinvent them.

## The systems this binds to (do not duplicate)

| Layer | What | Where |
|---|---|---|
| **Planner** | `route(GenRequest) → GenPlan` over engines + 6 aesthetic lanes + prompt patterns + win-rate learning | FrankX `lib/gen/` (`router.ts`, `lanes.ts`, `backends.ts`, `patterns.ts`) |
| **Per-platform strategy** | 9 platform personas + 3-layer stack (asset→composition→gate) + per-image strategy | FrankX `lib/visual-intelligence/` (VIS) |
| **Still execution** | NB2 / NBPro image gen CLI | `scripts/nb-generate.mjs` (needs `GEMINI_API_KEY`) |
| **3D + video + character** | `generate_image` / `generate_video` / **`generate_3d` (image→GLB)** / `create_character` | Higgsfield MCP (or `multimodal-studio` skill / `design-imagery` agent) |
| **Gates** | 6-step pipeline + 3-lens council + brand lock | `visual-creation`, `visual-creation-council`, `brand-guidelines` / `brand-kits.ts`, `integrity-guard` |
| **Manage** | asset registry + audit | `public/images/registry.json`, `VISUAL_INVENTORY_*.csv`, `scripts/scan-visual-registry.mjs` |

## Asset taxonomy — choose the right kind

| Asset kind | Use when | Produced by | Wired via |
|---|---|---|---|
| **Generated still** | hero/section/social imagery, posters, covers | `route()` → `nb-generate.mjs` (NB2/NBPro) or Fal/GPT-Image-2 | `next/image` (`priority` hero, lazy below-fold) |
| **3D GLB** ("real 3D at the core") | a brand object that should rotate/parallax with light — product, monolith, core | Higgsfield `generate_3d` from a concept still → compressed GLB | `useGLTF` + drei in an isolated R3F scene |
| **Cinematic hero video** | a scene that must move (atmosphere, product reveal) | Higgsfield `generate_video` (Kling/Hailuo/Veo/Sora) | `<video>` with a poster + `preload=metadata` |
| **Procedural R3F** | the metaphor is generative (constellation, signal field, particles) | hand-built Three.js (`roadmap-hero` pattern) | R3F scene, lazy |

**Decision rule:** prefer a generated still or GLB for a *thing*; a video for a *moment*; procedural only when the metaphor is literally a generated system. Never ship a procedural placeholder where a brand object is implied.

## Rules

- **Lane binding** — every asset request goes through `route()` with the brand's lane (Arcanea → liquid-glass / cinematic · FrankX → noir-tech / editorial · Starlight → cinematic). No ad-hoc prompts; the lane carries palette, lighting, refusals, quality bar.
- **World/character consistency** — `create_character` once per brand world; reuse the character/style ID across the whole asset set so a hub reads as one world.
- **Gate before commit** — every generated asset passes the `visual-creation-council` (3 lenses) + `brand-guidelines` + the taste rubric before it lands in the repo. No raw generations in `public/`.
- **Performance contract** (extends `three-webgl.md` + `performance.md`):
  - GLB: draco/meshopt-compressed, lazy `useGLTF`, dispose on unmount, DPR-capped scene, a **static poster** for load/reduced-motion/mobile.
  - Hero video: the **poster is the LCP image**; `preload=metadata`, muted/inline/loop only if it earns it, reduced-motion → poster, mobile → poster or short loop. Never autoplay heavy video on mobile.
- **Register everything** — after a keeper ships, add it to `registry.json` (+ inventory CSV) with id · type · lane · format · backend · prompt-ref · status, and log model+seed/job for reproducibility.

## Where it sits in the build sequence

```
… page spec → ASSET PLAN (manifest) → scene brief
  → ASSET PRODUCTION (this doc) → static build → motion
  → 3D/VIDEO INTEGRATION → polish → QA → DISTRIBUTE (VIS) → handover
```

Plan the manifest with `templates/asset-manifest.template.md`; run the stage with `workflows/03b-asset-production.md`. **Plan visuals at the hub level** — one lane, one character/world set, one shared 3D/video motif across a hub's pages — so pages carry only deltas and the site reads as one world.

## Availability / graceful degradation

`nb-generate.mjs` needs `GEMINI_API_KEY`; 3D/video needs the Higgsfield MCP authed. If neither is available, the OS still plans the manifest + prompts (via `route()`) and falls back to a procedural R3F hero or a designed CSS poster — and records the unrendered assets as `status: pending` in the manifest so they can be generated later. The build never blocks on asset generation.
