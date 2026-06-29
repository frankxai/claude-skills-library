# Example — Arcanea Flagship Page Spec

A worked page spec produced from the OS templates, used to build the first flagship proof (`arcanea-ai-app` → `apps/web/app/design-lab/web-os/`). Demonstrates that the OS templates yield a buildable spec. Brand canon: Arcanea `TASTE.md` / `DESIGN.md` / `@arcanea/design-system`.

## Page

- **Brand / token source:** Arcanea · `@arcanea/design-system` (tokens + `motion`) · base `#09090b`, Atlantean Teal `#00bcd4`, Cosmic Blue `#0d47a1`, Gold `#ffd700`; Geist / Instrument Serif / Geist Mono; glass `bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm`.
- **Route:** `/design-lab/web-os` (isolated labs route — no nav/SEO impact; a real showcase, not "coming soon").
- **Register:** AI-lab premium, never fantasy-game. Mythology in the words, not the chrome.
- **Editorial rhythm:** large (hero) → quiet (thesis) → dense (system) → quiet (proof) → conversion.

## Scenes

### 1. Hook — "Intelligence core" hero
- **Dominant idea:** *This is the operating system behind premium worlds.*
- **Focal object:** a slow-drifting intelligence-core / constellation, R3F. Reuse the `roadmap-hero.tsx` pattern (Stars/Float/useFrame/multi-light) as the base; optionally the `lumina-orb` shader for the core. Lazy `ssr:false` with a static poster (also the LCP image).
- **Copy:** display line + one sub-line + one CTA ("Enter the System"). No paragraph.
- **Motion:** `heroReveal` (blur-to-focus) on load for the display line; one scroll-scrubbed camera beat on the core. No hover scale.
- **Type:** oversized Geist display, expo `[0.16,1,0.3,1]`.
- **Rubric targets:** Composition 5 (focal), all others ≥4.

### 2. Mechanism — how the OS works
- Three-step structure (read canon → scene brief → gated build), as a horizontal progression, NOT three equal icon cards. `staggerContainer(0, 0.06)` + `revealUp`, `whileInView` once.
- Quiet scene, generous gutters, ≥50% negative space.

### 3. Proof / System panel — the constraints made visible
- A `liquid-glass` panel showing the taste rubric axes + the gate sequence. Real structure, not a wall of text. Diagrammatic.

### 4. Brand-worlds strip — one OS, three worlds
- Starlight / Arcanea / FrankX as three restrained tiles bound to their accents. Demonstrates reuse-vs-unique. Color/border transitions on hover (no scale-spam).

### 5. Conversion
- One calm CTA scene. Honest status badge. Footer-adjacent, no CTA farm.

## Components (under `apps/web/components/web-os/`)
- `WebOsHero` (client, lazy 3D child `WebOsCore`) · `WebOsMechanism` · `WebOsRubricPanel` · `WebOsWorlds` · `WebOsCta`.
- Server Components by default; `'use client'` only for the hero, motion, and 3D.

## Dependencies
- Present (verify versions): `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `gsap`, `@gsap/react`. ✅ in `apps/web/package.json`.
- `lenis` / `postprocessing`: **not present** — add only if scene 1's camera beat or bloom demonstrably needs them; lazy; log in `decision-log.md`.

## Interaction states
- Hero: loading (poster) → loaded; reduced-motion (frozen poster + static line); mobile 375px (poster or simplified core, stacked copy).
- All reveals have a reduced-motion equivalent.

## Success criteria
- Passes all 7 Arcanea gates + the OS `release-check.md`.
- `pnpm --filter web build` green; TS strict; no raw hex; no `domMax`; banned fonts absent.
- CWV: LCP < 2.5s, INP < 200ms, CLS < 0.1. Taste rubric ≥4 every axis, 5 on hero composition.
- This spec matches what shipped (self-test).
