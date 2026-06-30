# 03b — Asset Production

Purpose: turn the asset manifest into real, gated, registered assets (imagery / 3D / video) before the static build. Runs after the scene brief, before implementation. See [`../visuals.md`](../visuals.md).

Inputs:
- The asset manifest ([`../templates/asset-manifest.template.md`](../templates/asset-manifest.template.md)) for this page/hub.
- The brand world + lane ([`../brand-worlds.md`](../brand-worlds.md)).

Steps:
1. **Plan each asset** — for every manifest row, call `route()` (`lib/gen/router.ts`) with `{subject, context, useCase, laneId, format}` to get the resolved prompt + backend + gate. No hand-written prompts.
2. **Pick the engine by type:** still → `nb-generate.mjs` (NB2/NBPro) or the routed backend; **3D GLB** → Higgsfield `generate_3d` from a concept still; **video** → Higgsfield `generate_video`; procedural → no generation (build in code).
3. **Consistency** — if the manifest names a character/world id, pass it (`create_character` once, reuse) so the set is coherent.
4. **Gate** — run `visual-creation-council` (3 lenses) + `brand-guidelines` + the taste rubric. Reject/regenerate on fail. Nothing enters `public/` ungated.
5. **Optimize + place** — stills → WebP/AVIF at the manifest sizes into `public/brand/<brand>/…`; GLB → draco/meshopt-compressed; video → MP4 + a still **poster** (the LCP).
6. **Register** — add each keeper to `registry.json` (+ inventory CSV): id · type · lane · backend · path · status; log model + seed/job id.
7. **Plan platform variants** — run VIS per-image strategy for the target platforms; record the variants in the manifest for the Distribute stage.

Output / artifact: generated assets in `public/…` + the manifest updated to `status: gated/shipped` + registry entries.

Gate: every shipped asset passed the council + brand gate + perf contract; pending assets (no keys) are logged `status: pending` with their resolved prompt so they can be generated later.

Next: [`05-implementation.md`](./05-implementation.md) (static build), then 3D/video integration per [`../three-webgl.md`](../three-webgl.md).
