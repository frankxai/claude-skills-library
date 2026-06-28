# Example — FrankX Flagship Page Spec

A worked spec for a FrankX.ai flagship surface. Brand canon: FrankX root `design.md` + `taste.md`; tokens from `lib/design-system.ts` + `tailwind.config.js`. Production posture: branch + PR, never direct-to-main; never rename working URLs.

## Page
- **Brand / token source:** FrankX · `lib/design-system.ts` + `tailwind.config.js` (dual-spectrum tech/soul + ana). Dark base, controlled accents. "AI Architect" stays "AI Architect."
- **Route:** a flagship marketing surface (new route or labs; do not delete/rename existing pages with traffic).
- **Register:** executive AI command layer — sharp, direct, elite, tactical, controlled. No cute bots, no soft startup gradients.
- **Editorial rhythm:** cockpit hero → broken-default tension → mechanism (the 6-pillar architecture) → proof → leverage CTA.

## Scenes
1. **Hook — intelligence console / cockpit.** Focal object: a signal radar / agent-swarm motif (R3F or high-craft SVG-with-motion), decisive minimal motion. Display line + sub + CTA "See the Operating Model." `heroReveal`; one fast-but-precise beat (FrankX motion is fast, not slow). Poster fallback.
2. **Enemy / broken default — quiet.** Name the status quo it replaces. One line, high contrast.
3. **Mechanism — system panel.** The architecture as structure (deal room / console), not a wall of text. Stagger reveal.
4. **Proof — real outcomes only.** Specific, provenance-marked; no invented metrics; ownership verbs precise (built / contributed / advised).
5. **Conversion — leverage CTA.** One primary CTA: "Request Private Build" / "Start the Signal Review."

## Components
`FrankxConsoleHero` (lazy 3D/SVG `FrankxRadar`) · `FrankxBrokenDefault` · `FrankxArchitecturePanel` · `FrankxProof` · `FrankxCta`.

## Dependencies
Use the existing FrankX stack (Next 16, React 18, framer-motion, gsap, three/R3F present). `lenis`/`postprocessing` per-scene only, lazy, logged.

## Interaction states
Hero loading→loaded; reduced-motion frozen radar; mobile 375px simplified; reveals reduced-motion safe.

## Success criteria
OS `release-check.md` + FrankX guardians (`/v BUILD`, `@integrity-guard`, `merge:gate`) pass · build green, TS clean, tokens not hex · CWV budgets met · taste rubric ≥4 all axes, 5 on hero · brand specificity unmistakably FrankX (executive, not generic AI-assistant) · no working URL renamed/deleted.
