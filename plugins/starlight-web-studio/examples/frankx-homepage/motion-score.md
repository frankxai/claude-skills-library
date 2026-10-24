# Motion score: frankx.ai homepage, direction B

Motion director, 2026-10-20. One set-piece, per the FrankX design system.

| Beat | Trigger | What moves | Why | Duration / ease | Reduced-motion state |
|---|---|---|---|---|---|
| 1. Hold | page load | nothing; type is already there | the static composition carries the page | none | same |
| 2. Step the run | scroll, first screen pinned for 150vh, desktop 900px+ only | the active row of the development snapshot (brief → build → review → ship) gains a tinted background and a cyan marker; other rows keep readable text | replays public evidence of this studio being built, which is the page's proof; no live region, so screen readers hear the static final state | row index derived from the smoothed timeline's progress, 0.6s smoothing | all four rows shown in their final state |
| 3. Dim the room | same scroll range | a dark veil over the image rises from 0 to 0.45 | attention moves from the place to the artifact as the run completes | scrubbed with beat 2 | veil at 0; nothing moves |
| 4. Light on glass | mouse movement over the panel (touch and pen are ignored) | a radial highlight follows the pointer | makes the glass read as a physical surface | one update per frame; a pending frame is cancelled on leave, cancel and preference change | no highlight |

Rules held:

- Content is fully visible without JavaScript; motion states are set from a class added after mount, never shipped in server HTML.
- Phone and tablet under 900px: no pin, no scrub; the panel sits below the headline in its final state.
- Transform and opacity only in scrubbed tweens. GSAP 3.12.5 with ScrollTrigger (free for client sites under the 2025 licence).
- Second section is in view after 1.5 viewports of scroll at most.
