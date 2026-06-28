# Motion / 3D Spec — `<scene-or-component-name>`

> Purpose: lock one animated scene — trigger, variant, the cinematic-beat declaration, GSAP timeline, and the full WebGL per-scene spec. Step 5–6 of the build. Reference `motion.md` + `three-webgl.md`; use named primitives, don't hand-roll.

## Identity

- **Scene / component:** `<...>`
- **Page / route:** `<...>`
- **Motion layer (from `motion.md`):** `<1 page-transition | 2 scroll-scene | 3 text-reveal | 4 component-entrance | 5 hover | 6 ambient | 7 3D camera/object>`

## Trigger

- **Fires on:** `<load | inView (once, margin -100px) | hover | scroll-scrubbed | route-change>`
- **Scroll source of truth (if scroll):** `<native | GSAP ScrollTrigger | lenis-driven ScrollTrigger.update>` — one only.

## Named variant + timing

- **Variant:** `<heroReveal | revealUp | scaleIn | scrollFade | staggerContainer | magneticHover | ...>`
- **Easing token:** `<[0.16,1,0.3,1] hero | [0.22,1,0.36,1] standard | [0.4,0,0.2,1] UI | spring{260,22}>`
- **Duration:** `<150 micro | 300–400 standard | 500–600 dramatic | 800ms+ cinematic>`
- **Stagger (if container):** `<staggerChildren 0.06 — a wave, not a wall>`

## Cinematic-beat declaration

- **Is this THE one cinematic beat for the page?** `<yes / no>`
- **If yes — the device (pick ONE):** `<pin | scrub | reveal | parallax | crossfade | camera progression | panel progression>`
- **The beat in one line:** `<what happens, e.g. "scroll scrubs the camera from wide orbit into the intelligence core as the display line mask-reveals">`
- [ ] One dominant scroll device (combining three fights itself).
- [ ] No more than one 800ms+ moment on the page.

## GSAP timeline outline (only if GSAP used)

```
gsap.context(() => {                         // scoped, cleaned up on unmount
  const tl = gsap.timeline({
    scrollTrigger: { trigger: <ref>, start: '<...>', end: '<...>', scrub: <true/n>, pin: <true/n> }
  })
  tl.to(<target>, { <transforms/opacity only — never width/height/top> })
    .to(<target>, { ... }, '<position>')
}, <scopeRef>)
// cleanup: ctx.revert() / ScrollTrigger.kill() on unmount
```

- [ ] Plugins registered once. Selectors scoped. Transforms/opacity only.

## WebGL per-scene spec (mandatory if 3D — `three-webgl.md`)

> A scene without every field below does not get built.

- **Metaphor:** `<intelligence core | orbital system | portal | glass monolith | constellation | command interface | signal field | data sculpture | ...>`
- **Camera behavior:** `<static | drift | scroll-driven progression>`
- **Lighting:** `<key / rim / environment — premium 3D is mostly light>`
- **Material language:** `<glass | metal | emissive | obsidian | ...>`
- **Object count (explicit cap):** `<n meshes / particle ceiling>`
- **Performance budget:** `<target fps on mid hardware | DPR cap [1,2] | draw-call ceiling | particle ceiling>`
- **Fallback image:** `<static poster path — also the LCP image>`
- **Mobile behavior:** `<simplified scene | poster>`
- **Reduced-motion behavior:** `<frozen frame | poster>`
- **Lazy-load:** `dynamic(() => import(...), { ssr: false, loading: <Poster/> })` + `<Suspense>`
- **Postprocessing (if any):** `<bloom/vignette — lazy, justified, logged; none on mobile>`

## QA checks

- [ ] No jank; 60fps scroll.
- [ ] Reduced-motion path verified (reveal, beat, 3D/ambient).
- [ ] Mobile behavior intentional and verified.
- [ ] Attention hierarchy preserved — one thing leads.
- [ ] Only one property/element owner per library (no GSAP+Motion on same prop).
- [ ] (3D) DPR capped · memory disposed (no leak on route change) · poster present · metaphor legible.
- [ ] Any new dep (`postprocessing`, `lenis`) recorded in `decision-log.md`.
