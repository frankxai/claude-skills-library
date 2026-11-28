---
name: cinematic-motion
description: Plan and build cinematic web motion - scroll choreography, pinned scenes, text reveals, page transitions - with GSAP (ScrollTrigger, SplitText), Lenis, Motion or the View Transitions API, always with a designed reduced-motion state and a performance budget. Use for scroll storytelling, hero animation, "make it feel cinematic", GSAP plans, parallax, page transitions, or a motion score for a page. Motion comes after the static composition works.
---

# Cinematic motion

Motion is the last layer, not the first. If the page does not work as a still,
motion makes it worse faster.

## 1. Write the motion score first

`.studio/<id>/motion-score.md`, one row per beat:

| Beat | Trigger | What moves | Why (state, focus, or story) | Duration / ease | Reduced-motion state |
|---|---|---|---|---|---|

A beat with no answer in "why" is cut. Most pages need three to six beats.

## 2. Pick the lightest tool that does the job

| Job | Tool |
|---|---|
| hover, press, small state changes | CSS transitions, or Motion for React components |
| layout and shared-element transitions | Motion `layout`, or the View Transitions API |
| route transitions | View Transitions (`next-view-transitions` in Next.js), Swup for multi-page sites |
| scroll-linked scenes, pinning, scrubbing | GSAP ScrollTrigger |
| split text reveals | GSAP SplitText |
| smooth scroll | Lenis, only on routes where the scenes need it |

GSAP and all its former Club plugins are free for commercial use since Webflow's
2025 license change. The license excludes building a visual no-code animation
tool that competes with Webflow; client sites are fine. Read the current
license page before shipping something that is itself an animation tool. If the
`gsap-skills` from GreenSock are installed, load them for current API shapes.

## 3. Build rules

- React: `useGSAP` with a scope ref so everything reverts on unmount. Register
  plugins once. Create ScrollTriggers after layout settles; call
  `ScrollTrigger.refresh()` after fonts and images load.
- Never ship content at `opacity:0` in server HTML. Set initial states from a
  class added after mount, so the page reads fully without JavaScript.
- `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` builds the reduced
  path explicitly: crossfades or instant states, no scrub, no pin longer than
  one viewport, Lenis off.
- Pin and scrub budgets: no scene longer than 150vh on mobile; the second
  section is visible within two viewports of scroll.
- Animate `transform` and `opacity` only. No layout properties in a scrubbed tween.
- Smooth scroll breaks anchors, find-in-page and keyboard scrolling if done
  carelessly. Test all three.

## 4. Verify

Record the page with and without reduced motion (the `visual-proof` runner's
`--reduced-motion` flag where available). Check on a real mid-range phone, not
just emulation. Report frame drops you saw, not ones you assumed away.
