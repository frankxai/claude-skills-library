# Design System

The reusable visual grammar. This file defines **categories and doctrine**; concrete values come from the brand's real token source (the token-binding contract in `brand-worlds.md`). Never invent hex/spacing inline.

## Visual Architecture

The default register across these brands: a dark editorial base, cinematic lighting, precise grids broken by deliberate asymmetry, atmospheric gradients, a restrained accent color, large typography, a glass/obsidian/starlight material language, and spatial depth built from a few layers.

## Token categories (values live in the brand token file)

**Colors** — `bg-primary`, `bg-secondary`, `surface-glass`, `surface-elevated`, `text-primary`, `text-secondary`, `text-muted`, `border-subtle`, `accent-primary`, `accent-secondary`, `accent-danger` (only when needed).
*Binding:* Arcanea → `@arcanea/design-system` tokens; FrankX → `lib/design-system.ts` + `tailwind.config.js`.

**Spacing** — viewport gutters, section padding, stack spacing, grid gaps. Use the brand's scale (4/8-based); never arbitrary px.

**Typography** — `display`, `headline`, `subheadline`, `body`, `mono/label`, `eyebrow`. One display face, one body, one mono; an editorial serif accent only if the brand has one. Never Inter/Space Grotesk/Cinzel/Arial as a default.

**Radii** — `sharp`, `sm`, `md`, `lg`, `cinematic-panel`. Pick one radius rhythm; don't mix bubbly 16px+ across 80% of elements.

**Borders** — `hairline`, `luminous`, `glass`. One canonical glass recipe per brand (e.g. Arcanea `bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm`) — do not re-roll opacity per surface.

**Shadows / depth** — avoid generic card drop-shadows. Use ambient depth and restrained glow. Depth = layering + light, not box-shadow.

**Effects** — subtle noise, radial atmosphere, optional grid overlay, scanline only if brand-appropriate. No decorative clutter.

## Layout Rules

- **Build in scenes, not sections.** Each scene has a role: hook, proof, explanation, mechanism, conversion.
- Use `max-width` intentionally; cap text measure (~66ch).
- Use asymmetry deliberately; avoid equal-card grids unless the content is genuinely a comparison.
- **Editorial rhythm:** large → quiet → dense → quiet → conversion. Vary density; never uniform.

## Component standards

Each component: **purpose · visual behavior · interaction behavior · anti-patterns.**

- **Hero** — one dominant claim + one focal object + one CTA. No paragraph soup. Anti: carousel, autoplay video, three equal cards.
- **Navigation** — quiet until needed; clear primary action. Anti: mega-menus on a marketing site, low-contrast links.
- **CTA** — one primary per scene, brand-aligned verb. Anti: 3 equal-weight buttons, vague "Learn more".
- **Proof cards** — real proof only; specific numbers with provenance. Anti: invented metrics, logo soup.
- **System panel** — explains a mechanism with structure (diagram/steps). Anti: wall of text.
- **Case study** — outcome-led, concrete. Anti: generic testimonial blocks.
- **Feature cards** — only when comparing; differentiated, not symmetric clones. Anti: icon-circle + title + 2-line desc ×3.
- **Scroll sections** — one choreographed beat; reduced-motion fallback. Anti: every section animating.
- **Footer** — calm, navigational, honest status. Anti: another CTA farm.

## Responsive doctrine

Mobile is **not** a squeezed desktop. At 375px preserve: hierarchy, first-viewport drama, readable type (≥16px body), motion restraint, and a static fallback for heavy 3D. Design the mobile scene intentionally — reflow, don't just stack.

## Design QA checklist (quick)

- One focal point per scene? 40–60% quiet?
- All color/spacing/type from tokens (no raw hex)?
- Type scale consistent; measure capped; body ≥16px?
- One radius rhythm; one glass recipe; no generic drop-shadows?
- No equal-card grid standing in for real content?
- Mobile scene intentional at 375px?
- Full pass: `checklists/design-check.md`.
