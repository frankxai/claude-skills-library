# Preflight Checklist

> Run before writing any code. Confirms the repo, brand truth, intake targets, and scene intent are known — so the build starts from facts, not assumptions. Pairs with [`CLAUDE.md`](../../CLAUDE.md) required build sequence.

## Repo inspection

- [ ] Framework identified (Next.js App Router / Pages / Vite / other) and version read from `package.json`.
- [ ] Package manager identified (pnpm / npm / yarn) — use the lockfile present; do not introduce a second one.
- [ ] Styling system identified (Tailwind + config / CSS modules / styled / vanilla-extract) and its token source located.
- [ ] Existing component + directory conventions read; WebGL/visual home located (`components/visuals/` or `components/web-os/`).
- [ ] Existing motion approach noted (`@arcanea/design-system/motion` present? GSAP? Lenis?) so a second scroll system is not added.

## Brand token source

- [ ] Brand world identified via [`../brand-worlds.md`](../brand-worlds.md) and its real token file located (e.g. Arcanea `@arcanea/design-system`; FrankX `lib/design-system.ts` + `tailwind.config.js`).
- [ ] Color / spacing / type / radius / glass tokens confirmed to exist for this brand — no inline hex will be needed.
- [ ] If the repo's token migration is incomplete, the stated migration plan is read (no new raw-hex debt to be added).

## Intake targets

- [ ] Target viewports set: 1920 / 1440 / 768 / 375.
- [ ] Taste rubric target set (flagship = ≥4 every axis, 5 on focal axis) per [`../taste.md`](../taste.md).
- [ ] Performance budgets noted: LCP < 2.5s, INP < 200ms, CLS < 0.1, 60fps scroll.
- [ ] Accessibility target set: WCAG 2.2 AA (AAA only where brand canon demands).

## Scene brief + page spec exist

- [ ] Page spec created/updated from `templates/page-spec.template.md`.
- [ ] Scene brief created/updated from `templates/scene-brief.template.md` — no build starts from a bare adjective.
- [ ] Each scene's role declared (hook / proof / explanation / mechanism / conversion) and its one dominant idea named.
- [ ] If 3D is planned, a motion-spec exists (`templates/motion-spec.template.md`) with metaphor + budget + fallback.

## Dependencies verified

- [ ] Every library the build will use is present in `package.json` (`three`, `@react-three/fiber`, `@react-three/drei`, `motion`/`framer-motion` as applicable).
- [ ] Any not-present dependency (`postprocessing`, `lenis`, etc.) is justified and recorded in [`../decision-log.md`](../decision-log.md) before adding.
- [ ] Real API of each key library confirmed from the package source in `node_modules` (or its official docs) for the installed version — not from memory.
