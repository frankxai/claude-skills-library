# Motion Check

> Verifies motion is narrative hierarchy over time, per [`../motion.md`](../motion.md). Motion serves attention; it never decorates or janks.

## Named vocabulary

- [ ] Named variants used (`heroReveal`, `revealUp/Down`, `scaleIn`, `scrollFade`, `staggerContainer`, `magneticHover`) — imported from `@arcanea/design-system/motion` when present, else replicated to the exact values.
- [ ] Named easing tokens used, never the library default: expoOut `[0.22,1,0.36,1]`, Apple expo `[0.16,1,0.3,1]`, material `[0.4,0,0.2,1]`, or spring `{stiffness:260,damping:22}`.
- [ ] Durations from the timing ladder (150ms micro · 300–400ms standard · 500–600ms dramatic · 800ms+ cinematic) — no hand-rolled durations scattered everywhere.
- [ ] Stagger is a wave (`staggerChildren ≈ 0.06`), not a wall.

## One cinematic beat

- [ ] Exactly one cinematic moment (800ms+ / pinned / scrubbed) per page — no more.
- [ ] Split-character/letter reveal reserved for at most one hero line.

## No scale-spam / no anti-patterns

- [ ] No `whileHover={{ scale: 1.05 }}` on every card.
- [ ] No flat `opacity 0→1` with no stagger/spring as the default reveal.
- [ ] No `transition-colors` as the *only* hover state.
- [ ] No "everything animating / constant ambient floating" — something leads, the rest supports.

## One scroll system

- [ ] One scroll system per page — Lenis + native + GSAP smoothing are not fighting each other.
- [ ] If Lenis is used, `ScrollTrigger.update` is driven from it.
- [ ] Animations target transforms/opacity only — never layout props (width/height/top).
- [ ] Ownership assigned: GSAP owns scroll-scrubbed transforms; Motion owns enter/hover. The same property of the same element is not animated by both.
- [ ] Each scroll scene picks one dominant device (pin / scrub / reveal / parallax / crossfade / camera) — not three combined.

## GSAP cleanup

- [ ] Plugins registered once.
- [ ] Timelines created in `useGSAP`/effect and cleaned up on unmount.
- [ ] Selectors scoped via `gsap.context`/scope ref — no leaked global selectors.
- [ ] `ScrollTrigger` runs only after DOM ready.

## React / bundle

- [ ] `LazyMotion` + `domAnimation` used — never `domMax`.

## Reduced motion + performance

- [ ] `prefers-reduced-motion` honored: every reveal, the scroll beat, and ambient drift have a static/minimal-fade equivalent.
- [ ] Scroll holds 60fps on mid hardware (no jank).
- [ ] Mobile motion behavior is intentional, not the desktop sequence shrunk.
