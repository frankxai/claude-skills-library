# Example — Starlight Flagship Page Spec

A worked spec for a Starlight Intelligence Systems flagship. Starlight has no production web app yet, so tokens are defined fresh from the brand world (then promoted to a `design-system` when a Starlight site lands). Brand canon: `brand-worlds.md` → Starlight.

## Page
- **Brand / token source:** Starlight (fresh tokens). Base obsidian `#05060A`; accents: starlight (cool white-blue) + faint plasma (cyan-violet), gold used only for a single signal. Display: a confident grotesk/Geist-class face; mono for labels.
- **Route:** flagship landing (e.g. `/`).
- **Register:** nocturnal intelligence lab meets mythic oracle — sovereign, quiet power. No dashboards, no neon-hacker cliché.
- **Editorial rhythm:** observatory hero → quiet thesis → constellation system → signal proof → sovereign CTA.

## Scenes
1. **Hook — command observatory.** Focal object: an intelligence core / star map, R3F, slow orbital drift (gravitational motion). Display line + sub + CTA "Build the Intelligence Layer." `heroReveal`; one scroll-scrubbed orbital beat. Static poster fallback.
2. **Thesis — quiet.** One sentence on sovereignty / persistent context. ≥55% negative space.
3. **System — constellation graph.** The substrate as a constellation/signal field; nodes reveal on `whileInView` stagger. Diagrammatic, not decorative.
4. **Proof — signal panel.** Real capabilities in a glass panel; specific, provenance-marked numbers only.
5. **Conversion — sovereign CTA.** One calm, high-trust CTA. Honest status.

## Components
`StarlightObservatoryHero` (lazy 3D `StarlightCore`) · `StarlightThesis` · `StarlightConstellation` · `StarlightSignalPanel` · `StarlightCta`.

## Dependencies
If scaffolding fresh: Next App Router + TS + Tailwind + Motion + GSAP + R3F/Drei; `lenis`/`postprocessing` only per-scene, lazy, logged.

## Interaction states
Hero loading→loaded; reduced-motion frozen core; mobile 375px simplified core; all reveals reduced-motion safe.

## Success criteria
OS `release-check.md` passes · build green, TS strict, tokens not hex · CWV LCP<2.5s/INP<200ms/CLS<0.1 · taste rubric ≥4 all axes, 5 on hero composition · brand specificity unmistakably Starlight (not generic dark SaaS).
