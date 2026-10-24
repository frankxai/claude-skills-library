# Directions: frankx.ai homepage

Art director, 2026-10-20. Static comps: the Claude Design canvas "FrankX homepage directions".
Each direction differs from the others on at least two of composition, typography, material, interaction, motion.

## A. The workbench (signature-safe)

- **Idea:** the first screen is a working blueprint, not a promise about one.
- **Composition:** left 5 columns: one fixed headline, two-line deck, one CTA. Right 7 columns: a real trace of a blueprint run (brief → build → verify) in a solid `elevated` panel.
- **Typography:** Poppins 800 headline, one Playfair italic word ("own"), Inter deck, JetBrains Mono in the trace.
- **Material:** flat void, one `tech-border` hairline around the panel. No glass, no image.
- **Motion:** none on load. The trace's rows are static; a "Replay" button replays them (state, not decoration).
- **Risk:** reads as a developer tool; a non-coding founder may bounce.

## B. The studio window (bold evolution) — recommended

- **Idea:** you are looking into the room where the systems get built, and the glass panel in front of you is the system running.
- **Composition:** full-bleed photographic render of a real-feeling workspace at night; a liquid-glass panel floats over the lower right holding the same blueprint trace; headline and CTA on the left over a reading vignette.
- **Typography:** same families as A, larger display (display-2xl), deck at body-lg.
- **Material:** generated image (Codex image generation, provenance sidecar), glass over imagery only (`surface-3`, `blur-xl`, `radius-5xl`), soft vignette.
- **Motion:** the one set-piece. On scroll, the glass panel stays pinned while its trace steps brief → build → verify → shipped, and the room behind dims a step each time. Reduced motion: the four steps render as a static stack under the hero.
- **Risk:** image quality carries the page; a weak render makes it slop. Gate: the media inspection at 375, 768, 1440.

## C. The field notebook (wildcard)

- **Idea:** the homepage is the latest page of Frank's notebook.
- **Composition:** single 680px reading column; Frank's own line as the opener in Playfair italic; below it a dated list of what shipped this month (real entries only), each with one link.
- **Typography:** Playfair for the opener only, Inter at body-lg, dates in JetBrains Mono.
- **Material:** `ink-contemplative` warm ink on void (editorial rail tokens), no panels, no glow.
- **Motion:** none.
- **Risk:** depends on a steady publishing cadence; a stale date is worse than no date.

## Comparison

| | A workbench | B studio window | C field notebook |
|---|---|---|---|
| Proof on first screen | trace | trace over a scene | dated list |
| Beats Simon Willison on proof density | yes | yes | ties |
| Beats Lee Robinson on clarity of offer | yes | yes | no |
| Mobile | strong | needs the static fallback | strongest |
| Build cost | low | medium-high (media, motion) | low |
| Brand fit (DESIGN.md "real working scene") | good | best | good |

Recommendation: **B**, with A's trace as its content and A as the fallback if the render does not pass inspection.
