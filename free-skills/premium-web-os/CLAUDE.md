# Claude Operating Rules — Premium Intelligence Web OS

You are operating inside the Premium Intelligence Web OS. These rules are binding for any web/UI/visual build in a repo that has this OS installed or mirrored.

## Source of truth

- Treat `_intelligence/` as the source of truth. Read before you build.
- Do not invent brand direction — use [`_intelligence/brand-worlds.md`](./_intelligence/brand-worlds.md) and the brand's real token file it points to.
- Do not invent taste — use [`_intelligence/taste.md`](./_intelligence/taste.md).
- Do not invent motion style — use [`_intelligence/motion.md`](./_intelligence/motion.md).
- Do not build from a vague adjective — first create or update a **Scene Brief** ([`_intelligence/templates/scene-brief.template.md`](./_intelligence/templates/scene-brief.template.md)).

## Required build sequence

1. Read the relevant `_intelligence` docs for this task.
2. Create / update a **page spec** (`_intelligence/templates/page-spec.template.md`).
3. Create / update a **scene brief** (`_intelligence/templates/scene-brief.template.md`) + an **asset manifest** (`_intelligence/templates/asset-manifest.template.md`).
4. **Produce assets** — imagery / 3D-GLB / video via the gen-lanes + Higgsfield, gated. See [`_intelligence/visuals.md`](./_intelligence/visuals.md) + `_intelligence/workflows/03b-asset-production.md`. (No keys? plan the manifest, fall back to procedural/poster, mark `pending`.)
5. Build the **static composition** — layout, type, hierarchy, color. No motion yet.
6. Add **motion** — choreographed, per `motion.md`.
7. Add **3D / video** — generated GLB (`useGLTF`) or hero `<video>`, or procedural; always with poster + mobile + reduced-motion fallback, per `three-webgl.md`.
8. **Polish** — the taste polish pass.
9. Run **QA** — `_intelligence/checklists/release-check.md`; then **distribute** per-platform via VIS.
10. Update [`_intelligence/decision-log.md`](./_intelligence/decision-log.md) + the asset registry.

## Hard rules (these block a build)

- Always inspect the repo before editing: stack, package manager, framework, styling system, existing conventions. Preserve existing architecture unless clearly broken.
- Do not use dependencies absent from `package.json` unless you explicitly add them with a justification recorded in the decision log. Verify a package's real API from the package source in `node_modules` (or its official docs) before coding against it — never from memory.
- Do not animate everything. Motion serves hierarchy; one cinematic moment per page, no more.
- Do not use random colors, random gradients, stock SaaS layouts, emoji-as-icons, Unicode-glyph icons, or generic equal-card grids.
- Do not create components without responsive behavior. Mobile (375px) is a first-class target, not a squeezed desktop.
- Do not create 3D without a static poster fallback, a mobile simplification, and a reduced-motion state.
- Do not ship without the performance and accessibility pass.
- Do not leave TODOs in code. Put them in `decision-log.md` with an owner and a reason.
- Do not claim awards, certifications, client outcomes, or metrics unless the user provided them.
- Do not copy a specific creator, site, or brand. Deconstruct the principle (`reference-deconstruction.md`) and create original execution.
- Surgical changes only: touch what the task requires, match surrounding style, don't "improve" adjacent code.

## Token discipline

- No raw hex in app code. Bind to the brand's token source (see `brand-worlds.md`). If the repo's token migration is incomplete, follow the repo's stated migration plan — do not add new raw-hex debt.

## Verification before "done"

A build is not done until: it compiles/builds (not just `dev`), TypeScript is clean, the release checklist passes, reduced-motion + mobile + 3D-fallback are verified, and the page spec you committed actually describes what shipped.
