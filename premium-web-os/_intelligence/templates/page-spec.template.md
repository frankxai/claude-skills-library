# Page Spec — `<page-name>`

> Purpose: define a whole page before building — brand, scenes, components, data, SEO, success. Step 2 of the build sequence; each scene gets its own `scene-brief.template.md`.

## Identity

- **Page name:** `<...>`
- **Route:** `<app/.../page.tsx — exact route>`
- **Brand world:** `<Starlight | Arcanea | FrankX>` (see `brand-worlds.md`)
- **Token source:** `<@arcanea/design-system | lib/design-system.ts + tailwind.config.js | fresh-from-world>`
- **Page purpose (one sentence):** `<what this page must achieve>`
- **Primary conversion:** `<the one action this page drives>`

## Scene list (ordered)

> Editorial rhythm: large → quiet → dense → quiet → conversion. Vary density; never uniform. One cinematic beat across the whole page.

| # | Scene name | Role | Rhythm slot | Cinematic beat owner? |
|---|---|---|---|---|
| 1 | `<hero>` | hook | large | `<yes — the one beat>` |
| 2 | `<...>` | proof | quiet | no |
| 3 | `<...>` | mechanism | dense | no |
| 4 | `<...>` | explanation | quiet | no |
| 5 | `<...>` | conversion | conversion | no |

- [ ] Exactly one cinematic beat across all scenes.
- [ ] Rhythm varies — not five equal sections.

## Components per scene

| Scene | Components | New or existing? | Spec'd in component-spec.md? |
|---|---|---|---|
| `<hero>` | `<Hero, CTA, HeroScene(3D)>` | `<existing / new>` | `<y/n>` |
| `<proof>` | `<ProofCards>` | `<...>` | `<...>` |

## Data sources

| Data | Source | Shape / type | Static or runtime? |
|---|---|---|---|
| `<proof numbers>` | `<data/...ts | CMS | props>` | `<type ref>` | `<static>` |

- [ ] All public claims/metrics are real and have provenance.

## Interaction states

- **Nav:** `<quiet-until-needed behavior; primary action>`
- **Hover:** `<which elements; which named hover variant>`
- **Scroll:** `<one scroll system; who drives ScrollTrigger>`
- **Focus / keyboard:** `<tab order, visible focus>`
- **Loading / empty / error:** `<3D poster on load; data empty/error states>`

## Dependencies

| Package | Purpose | In package.json? (y/n) | If no: justification + decision-log entry |
|---|---|---|---|
| `three` / `@react-three/fiber` / `@react-three/drei` | 3D scene | `<y/n>` | `<...>` |
| `gsap` | scroll choreography | `<y/n>` | `<...>` |
| `motion` / `framer-motion` | enter/hover | `<y/n>` | `<...>` |
| `postprocessing` | bloom/vignette | `<y/n — often NOT present>` | `<add lazily + log>` |
| `lenis` | smooth scroll | `<y/n — often NOT present>` | `<one scroll system only>` |

- [ ] Verified each present package's real API from `node_modules`/docs, not memory.
- [ ] Every "no" has a decision-log entry before use.

## SEO / meta

- **Title:** `<≤60 chars>`
- **Description:** `<≤155 chars>`
- **OG image:** `<path — ideally the 3D static poster / LCP image>`
- **Canonical / route stability:** `<never rename a working URL without approval>`
- **Structured data:** `<Article | Product | FAQPage | none>`
- **Question-based H2s (AEO):** `<...>`

## Success criteria (verifiable)

- [ ] Builds clean (not just `dev`); TypeScript clean.
- [ ] First viewport reads premium before scroll (first-viewport rule).
- [ ] Each scene hits its scene-brief rubric targets.
- [ ] `release-check.md` passes.
- [ ] Reduced-motion + mobile (375px) + 3D-fallback verified.
- [ ] CWV budget met: `<LCP target / CLS target / INP target>`.
- [ ] This spec describes what actually shipped.
