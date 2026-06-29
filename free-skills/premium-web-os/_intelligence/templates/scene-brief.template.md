# Scene Brief — `<scene-name>`

> Purpose: lock one scene's intent before building. No scene gets built without this. Reference `taste.md`, `design.md`, `motion.md`, `three-webgl.md`; do not duplicate their values — point to them.

## Identity

- **Scene name:** `<kebab-case-id>`
- **Page / route:** `<page-spec.md it belongs to>`
- **Position in page:** `<n of N>` — editorial rhythm slot: `<large / quiet / dense / quiet / conversion>`
- **Role:** `<hook | proof | explanation | mechanism | conversion>`

## Dominant idea (one sentence)

> `<the single thing this viewport says. If you need two sentences, split the scene.>`

- [ ] One dominant idea only (taste rule 1)
- [ ] One visual focal point named below (taste rule 2)

## Focal object

- **What the eye lands on first:** `<the hero claim / the 3D object / the proof number / the diagram>`
- **Everything else is:** support. List the support elements: `<...>`

## Palette (token refs only — no raw hex)

- **Base:** `<bg-primary / bg-secondary token>`
- **Surface:** `<surface-glass / surface-elevated token + the one glass recipe>`
- **Text:** `<text-primary / text-secondary / text-muted tokens>`
- **Accent (≈2 max):** `<accent-primary>` , `<accent-secondary>`
- **Token source:** `<@arcanea/design-system | lib/design-system.ts + tailwind.config.js | fresh-from-brand-world>`
- [ ] No raw hex. ≤2 accents. High contrast where it matters.

## Type spec

- **Display:** `<face / token>` · size `<token>` · tracking `<token>` · weight `<...>`
- **Sub / headline:** `<token>`
- **Body / label:** `<token>` (body ≥16px)
- **Measure cap:** `<~66ch>`
- [ ] One display, one body, one mono. No banned faces (Inter / Space Grotesk / Cinzel as default).

## Layout / grid

- **Grid:** `<columns / gutters token>`
- **Composition stance:** `<full-bleed | asymmetric split | centered-with-intent>`
- **Negative space plan:** `<which 40–60% stays quiet>`
- [ ] 40–60% visually quiet (visual silence rule)
- [ ] Asymmetry is deliberate, not an equal-card grid standing in for content

## Motion intent

- **Named variant:** `<heroReveal | revealUp | scaleIn | scrollFade | staggerContainer | ...>` (from `motion.md`)
- **Easing token:** `<[0.16,1,0.3,1] hero | [0.22,1,0.36,1] standard | [0.4,0,0.2,1] UI | spring>`
- **Duration tier:** `<150ms micro | 300–400ms standard | 500–600ms dramatic | 800ms+ cinematic>`
- **The ONE cinematic beat (only if this is the page's beat):** `<pin / scrub / camera progression / mask reveal — describe it in one line, or "none — not this scene">`
- [ ] Motion serves hierarchy, not decoration. No bounce/elastic. One dominant scroll device.

## 3D metaphor

- **Metaphor:** `<intelligence core | orbital system | portal | glass monolith | constellation | ... | NONE>`
- **Why it earns its place:** `<the brand substance it represents — or "no 3D, atmosphere only">`
- > If 3D: fill the full per-scene spec in `motion-spec.template.md` (camera / lighting / material / object-count / perf-budget / fallback / mobile / reduced-motion). A scene without that spec is not built.

## Copy

- **Display line:** `<one line, strong nouns, short>`
- **Sub line:** `<one supporting line — no paragraph soup>`
- **CTA:** `<one primary verb-led CTA, or "none — non-conversion scene">`
- [ ] Honest claims only. No invented metrics/awards.

## Rubric targets (1–5 per axis, from `taste.md`)

> Flagship scene targets ≥4 every axis, 5 on the focal axis. Mark the focal axis.

| Axis | Target | Focal? |
|---|---|---|
| Composition | `<4/5>` | `<•>` |
| Hierarchy | `<4/5>` | |
| Typography | `<4/5>` | |
| Color / material | `<4/5>` | |
| Motion | `<4/5>` | |
| 3D integration | `<4/5 or n/a>` | |
| Brand specificity | `<4/5>` | |
| Originality | `<4/5>` | |
| Polish | `<4/5>` | |
| Performance perception | `<4/5>` | |

## Reduced-motion plan

- **Reveal fallback:** `<static | minimal fade>`
- **Scroll beat fallback:** `<static end-state>`
- **3D / ambient fallback:** `<frozen frame | poster>`
- [ ] Every reveal, the scroll beat, and all 3D/ambient have a reduced-motion equivalent.

## Mobile plan (375px, first-class)

- **Reflow:** `<how the scene reflows — not just stacked>`
- **First-viewport drama preserved:** `<what carries it on mobile>`
- **3D path:** `<simplified scene | poster>`
- [ ] Hierarchy + drama + readable type (≥16px) + motion restraint preserved at 375px.
