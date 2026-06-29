# Implementation Standards

How the code is written, so premium output is also clean output.

## Stack defaults (when scaffolding fresh)

Next.js App Router · TypeScript (strict) · Tailwind · Motion (`framer-motion`/`motion`) for component animation · GSAP + ScrollTrigger for scroll choreography · React Three Fiber + Drei for 3D · `lenis` for smooth scroll **only when a scene needs it**. No generic UI kit unless already present. No heavy visual dependency without clear value.

**When a repo already has a stack, use it.** Verify installed versions and real APIs from `package.json`/`node_modules` before coding.

## Code rules

- **Server Components by default**; `'use client'` only for state, refs, browser APIs, motion, or 3D.
- **TypeScript strict, no `any`**; typed props at every boundary.
- **Tokens are truth** — no raw hex/spacing in app code; bind to the brand token source.
- **Visuals isolated** — WebGL/3D in `components/visuals/` (or `components/web-os/`), lazy-loaded.
- **One scroll system**; assign GSAP vs Motion property ownership (see `motion.md`).
- **Files focused** (~≤500 lines); deep modules, simple interfaces; no cascade of shallow single-use wrappers.
- **Surgical changes**; match existing style; don't refactor adjacent code; clear names over narrating comments — comment only the non-obvious *why*.
- **No commented-out code, no `// TODO` in commits** — TODOs go to `decision-log.md` with owner + reason.
- **No secrets in code**; validate input at boundaries; sanitize paths.

## Dependency policy

Adding a dependency requires: it's genuinely needed, it's the lightest option, and the addition + reason is recorded in `decision-log.md`. Common adds for this OS: `lenis`, `postprocessing` — both lazy-loaded, both justified per scene.

## Definition of done

Production build green · types clean · lint clean · release checklist passed · page spec matches shipped output · decision log updated.
