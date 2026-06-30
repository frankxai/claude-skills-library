# Asset Manifest — <page or hub name>

> Every visual asset a page/hub needs, planned before generation. Plan at the **hub** level where possible (shared lane + character set + 3D/video motif); pages add deltas. Drives `workflows/03b-asset-production.md`. See `../visuals.md`.

- **Scope:** <page | hub | site>
- **Brand / lane:** <brand> · `route()` lane = <liquid-glass | cinematic | noir-tech | editorial | …>
- **Token source:** <@arcanea/design-system | lib/design-system.ts | fresh>
- **Character/world id (if any):** <create_character id — reuse across the set>

## Assets

| id | type | role | format / aspect | backend | prompt ref | output path | status |
|---|---|---|---|---|---|---|---|
| hero-core | 3d \| video \| still \| procedural | hero focal object | 16:9 / 2:3 / … | higgsfield generate_3d \| generate_video \| nb2 | `prompts/<id>.md` or route() | `public/brand/<brand>/<page>-hero.<ext>` | pending \| generated \| gated \| shipped |
| hero-poster | still | LCP + 3D/video fallback | 16:9 | nb2 | … | `…-hero-poster.webp` | pending |
| section-1 | still | proof/mechanism visual | 4:5 / 1:1 | nb2 | … | `…-s1.webp` | pending |
| … | | | | | | | |

## Social / platform variants (via VIS)
- Platforms needed: <linkedin · x · youtube-shorts · …> → run VIS per-image strategy; list the variants (1:1, 9:16, 1.91:1) each hero needs.

## Gates (every asset)
- [ ] Routed through `route()` with the brand lane (no ad-hoc prompt)
- [ ] Passed `visual-creation-council` (3 lenses) + `brand-guidelines`
- [ ] Meets the perf contract (GLB compressed/lazy + poster; video poster=LCP, reduced-motion→poster)
- [ ] Recorded in `registry.json` (id · type · lane · backend · status) + model/seed logged
