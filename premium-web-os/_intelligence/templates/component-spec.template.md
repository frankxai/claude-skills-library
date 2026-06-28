# Component Spec — `<ComponentName>`

> Purpose: define one component before building — purpose, interface, all states, responsive, motion ownership, a11y, anti-patterns. Reference `design.md` component standards; do not re-derive tokens.

## Identity

- **Component:** `<ComponentName>`
- **File:** `<components/web-os/... or components/visuals/...>`
- **Brand world:** `<Starlight | Arcanea | FrankX>`
- **Used by scenes:** `<scene names>`
- **Server or client:** `<server | client — WebGL/hover/state ⇒ client>`

## Purpose

> `<one sentence: what this component is for. If it overlaps another component, say why it's separate.>`

- **Component category (from `design.md`):** `<Hero | Navigation | CTA | Proof cards | System panel | Case study | Feature cards | Scroll section | Footer | visual/3D>`

## Props / interface

```ts
interface <ComponentName>Props {
  <prop>: <type>   // <what it controls, required/optional, default>
}
```

- [ ] Props are typed; no `any`.
- [ ] No raw hex/spacing in props — token refs only.

## Visual behavior

- **Static composition:** `<layout, focal element, what's quiet>`
- **Palette / material:** `<token refs + the one glass recipe if glass>`
- **Type:** `<display/body/label tokens>`
- **Radius / border / depth:** `<one radius rhythm; depth = layering+light, not generic drop-shadow>`
- [ ] Static comp hits hierarchy/type/color before any motion is added.

## Interaction behavior (all states)

| State | Behavior | Token / variant |
|---|---|---|
| default | `<...>` | |
| hover | `<named hover variant — no scale-spam>` | `<magneticHover / buttonHover>` |
| focus-visible | `<visible focus ring>` | |
| active / pressed | `<...>` | `<buttonTap>` |
| disabled | `<...>` | |
| loading | `<poster, not blank spinner>` | |
| empty / error | `<...>` | |

## Responsive behavior

- **Desktop `<1440/1920>`:** `<...>`
- **Tablet `<768>`:** `<...>`
- **Mobile `<375>`:** `<intentional reflow — not squeezed desktop; body ≥16px>`
- [ ] Mobile is designed, not auto-stacked.

## Motion ownership

> Do not animate the same property of the same element with both libraries.

- **GSAP owns:** `<scroll-scrubbed transforms / pinned timeline — or "none">`
- **Motion owns:** `<enter (whileInView once, margin -100px) / hover / tap>`
- **Variant + easing:** `<named variant + easing token from motion.md>`
- [ ] `LazyMotion` + `domAnimation` (never `domMax`) if Motion is used.
- [ ] Cleanup on unmount (GSAP context / ScrollTrigger kill; dispose 3D resources).

## Accessibility

- **Semantics:** `<correct element / role / heading level>`
- **Keyboard:** `<tab order, Enter/Space, Esc>`
- **ARIA:** `<labels for icon-only controls; live regions if dynamic>`
- **Contrast:** `<meets AA on text>`
- **Reduced motion:** `<static/minimal-fade equivalent>`
- [ ] Icon-only controls have accessible names. No emoji/Unicode-glyph as icon.

## Anti-patterns to avoid

- [ ] `<category-specific anti-pattern from design.md — e.g. Hero: carousel/autoplay/3 equal cards>`
- [ ] No `whileHover scale:1.05` on every card (layout shift / cargo-cult).
- [ ] No equal-card grid standing in for real content.
- [ ] No generic drop-shadows / inconsistent radii.
- [ ] No bare `opacity 0→1` with no ease as the only motion.
