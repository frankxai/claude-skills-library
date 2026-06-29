# Motion System

Motion is **narrative hierarchy over time.** It directs attention, reveals structure, creates anticipation, preserves performance, and feels inevitable. It must never decorate, distract, bounce randomly, make reading harder, jank the scroll, or fight the page hierarchy.

This file codifies the **production motion vocabulary** already shipping in `@arcanea/design-system` as the reference implementation. Use these named primitives; do not hand-roll durations everywhere.

## Motion personality (these brands)

Slow, gravitational, precise, cinematic, restrained, confident, atmospheric. **Avoid:** playful bounce, elastic SaaS motion, confetti, excessive spin, constant floating, over-staggering.

## Reference vocabulary (from `@arcanea/design-system/motion`)

```ts
// transitions
base:    { duration: 0.4,  ease: expoOut }      // standard reveals
fast:    { duration: ~.2,  ease: swift }        // micro / hover
slow:    { duration: ~.6,  ease: expoOut }      // hero reveals
spring:  { type: 'spring', stiffness: 260, damping: 22 }   // physical
magnetic:{ duration: 0.4,  ease: magnetic }     // CTA attraction

// variants
heroReveal:       opacity 0→1, y 32→0, filter blur(12px)→blur(0)   // the cinematic entrance
revealUp/Down:    opacity + y 24
scaleIn:          opacity + scale 0.96→1
fadeIn:           opacity (use sparingly — bare fades are 2022-tier)
scrollFade:       offscreen→onscreen, y 40→0 (with whileInView)
staggerContainer(delayChildren=0, staggerChildren=0.06)            // wave, not wall
magneticHover(intensity=1):  whileHover scale 1+0.03·i, whileTap 1−0.02·i
buttonHover: scale 1.02 · buttonTap: scale 0.98
```

When a repo has this package, **import these** — do not redefine. When it doesn't, replicate these exact values.

## Easing tokens (never the library default)

| Curve | Bezier | Use for |
|---|---|---|
| Linear-premium (`expoOut`) | `[0.22, 1, 0.36, 1]` | standard reveals, transitions |
| Apple expo-out | `[0.16, 1, 0.3, 1]` | hero reveals, cinematic feel |
| Material standard | `[0.4, 0, 0.2, 1]` | UI affordances, accordions |
| Spring | `{ stiffness: 260, damping: 22 }` | anything physical |

## Timing ladder

| Duration | Use |
|---|---|
| 150 ms | micro — hover, button press |
| 300–400 ms | standard — reveals, transitions |
| 500–600 ms | dramatic — hero reveal, modal entry |
| 800 ms+ | cinematic — **one** key moment per page, no more |

## Motion layers

1. Page-level transitions (View Transitions API where supported).
2. Scroll-directed scenes (the cinematic beat).
3. Text reveals.
4. Component entrance (`whileInView`, once, margin `-100px`).
5. Hover states.
6. Ambient background motion (subtle drift only).
7. 3D camera/object motion (see `three-webgl.md`).

## GSAP rules (scroll choreography)

- Use GSAP for pinned scenes, scrubbed timelines, complex sequences.
- Register plugins **once**; create timelines in a `useGSAP`/effect and **clean up on unmount**.
- Scope selectors (`gsap.context`/scope ref). Don't leak global selectors.
- Run `ScrollTrigger` only after the DOM is ready.
- **One scroll system per page** — do not run Lenis + native + GSAP smoothing fighting each other. If using `lenis`, drive `ScrollTrigger.update` from it.
- Animate transforms/opacity, not layout properties (width/height/top).

## Motion ⟷ React (Framer Motion / `motion`)

- Use Motion for local component state, hover/tap, small reveals, layout transitions.
- **`LazyMotion` + `domAnimation`** — never `domMax` (bundle weight).
- Do not animate the **same property of the same element** with both GSAP and Motion. Assign ownership: GSAP owns scroll-scrubbed transforms; Motion owns enter/hover state.

## Text reveal rules

Prefer mask/clip reveal, y-transform reveal, opacity+transform, line-by-line with restraint. Reserve split-character reveal for **one** hero line per page. Avoid chaotic letter animation, scrambling, excessive typewriter.

## Scroll scene grammar

`pin` · `scrub` · `reveal` · `parallax` · `crossfade` · `camera progression` · `panel progression`. A scene picks **one** dominant device; combining three fights itself.

## Reduced motion (law)

Respect `prefers-reduced-motion`. Provide a static or minimal-fade equivalent for every reveal, the scroll beat, and all 3D/ambient motion. Reduced-motion is not optional polish — it is part of "done."

## Motion anti-patterns (fail immediately)

- Flat `opacity 0→1` with no stagger/spring (2022-tier default).
- `whileHover={{ scale: 1.05 }}` on every card (cargo-cult, causes layout shift).
- Default `duration: 0.3` with no custom ease.
- Color-only Tailwind `transition-colors` as the *only* hover state.
- Everything animating; nothing leading. Constant ambient floating.
- Competing scroll systems → jank.

## Motion QA

No jank · reduced-motion verified · mobile behavior intentional · attention hierarchy preserved · 60fps scroll · one cinematic moment. Full: `checklists/motion-check.md`.
