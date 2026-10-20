# Handoff: frankx.ai homepage, direction B

Release verifier, 2026-10-20. Prototype only; nothing deployed.

## Verified

- **Layout at 1440 and 375 wide**, rendered in a browser: headline, recorded-run panel and CTA all on the first screen at desktop; on a phone the panel sits below the headline in its final state.
- **No-JavaScript and reduced-motion paths**: the recorded run renders complete without GSAP; motion only mounts under `(min-width: 900px) and (prefers-reduced-motion: no-preference)`, and `gsap.matchMedia` reverts it.
- **Links**: frankx.ai `/ai-architecture`, `/acos`, `/library`, `/blog` returned 200 on 2026-10-20; issue #76 and PR #77 on `frankxai/claude-skills-library` are public.
- **Media**: both crops carry provenance sidecars matching their current SHA-256 and are logged in the estate image ledger. Model and seed are not exposed by Codex image generation, so the render is marked non-reproducible.
- **CDN scripts** pinned to GSAP 3.12.5 with SRI hashes.

## Not verified

- **Safari and a real phone.** The glass has a dark base, an `@supports` fallback and a reduced-transparency path, but composited contrast was not measured on Safari, and no touch device was used.
- **The recorded run goes stale.** "Ship: waiting for a person to approve" is true today. When PR #77 merges or closes, the fourth row must change, or the proof becomes false.

## Owner decisions

1. **Direction B on the homepage.** It replaces more than half of the current page, so it needs the `surface-approved` label before a build PR.
2. **Whether to show this studio's own run** as the homepage proof, or a run from a blueprint a reader can install.
3. **Image.** Keep the generated studio scene, or replace it with a real photograph of the workspace (DESIGN.md §1 prefers a real person or place).
