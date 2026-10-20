# Worked case: frankx.ai homepage

One full R4 run of the studio (new page design), kept so a buyer can inspect every handoff instead of trusting the agent list. Nothing here is live on frankx.ai: the homepage is a protected surface and the cut is the owner's call.

| Step | Role | File |
|---|---|---|
| 1. Signature | art-director | [signature.md](signature.md) — the FrankX rules the page must keep |
| 2. Buyer and bar | audience-strategist | [brief.md](brief.md) — buyer, job, three named references to beat |
| 3. Three directions | art-director | [directions.md](directions.md) — workbench, studio window, field notebook |
| 4. Decision | director + gpu-artist | [decision.md](decision.md) — B chosen, A kept as fallback, no WebGL |
| 5. Media | media-producer | [media/hero.packet.md](media/hero.packet.md), two crops, each with a `.vis.provenance.json` sidecar |
| 6. Motion | motion-director | [motion-score.md](motion-score.md) — one pinned set-piece, reduced-motion state designed |
| 7. Build | site-builder | [prototype.html](prototype.html) — GSAP ScrollTrigger, CSS liquid glass, no build step |
| 8. Critique | Codex (different provider) | [critique.md](critique.md) — buyer who declined, then front-end review |
| 9. Handoff | release-verifier | [handoff.md](handoff.md) — what passed, what is unverified, what the owner decides |

The first render failed its media packet (a chair in the foreground, objects on the headline wall) and was regenerated; the first prototype got "revise" from Codex. Both failures are recorded rather than hidden.

To view the prototype, open `prototype.html` from this folder in a browser; the images load by relative path.
