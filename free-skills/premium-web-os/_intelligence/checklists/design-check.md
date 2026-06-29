# Design Check

> Verifies the static composition obeys the design grammar in [`../design.md`](../design.md). Tokens make it buildable; this list keeps it on-system.

## Tokens, not raw values

- [ ] No raw hex in app code — all color from brand tokens (`bg-*`, `surface-*`, `text-*`, `border-*`, `accent-*`).
- [ ] Spacing from the brand's 4/8-based scale — no arbitrary px gutters/padding/gaps.
- [ ] If the repo's token migration is incomplete, no new raw-hex debt added (followed the migration plan).

## Typography

- [ ] Type roles from the scale only (`display`, `headline`, `subheadline`, `body`, `mono/label`, `eyebrow`).
- [ ] One display face, one body, one mono (editorial serif accent only if the brand has one).
- [ ] No banned defaults (Inter / Space Grotesk / Cinzel / Arial as a default).
- [ ] Text measure capped (~66ch).
- [ ] Body text ≥ 16px.

## Radius + material rhythm

- [ ] One radius rhythm chosen; no bubbly 16px+ across 80% of elements.
- [ ] One canonical glass recipe per brand reused (e.g. `bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm`) — opacity not re-rolled per surface.
- [ ] No generic card drop-shadows; depth comes from layering + light, not box-shadow.

## Layout + content honesty

- [ ] No equal-card grid standing in for real content (cards only when content is a genuine comparison; differentiated, not symmetric clones).
- [ ] Built in scenes, not generic sections; each scene has a role (hook / proof / explanation / mechanism / conversion).
- [ ] `max-width` used intentionally; asymmetry used deliberately, not by accident.
- [ ] Proof cards carry real, specific numbers with provenance — no invented metrics, no logo soup.
- [ ] One primary CTA per scene with a brand-aligned verb (no 3 equal-weight buttons, no vague "Learn more").

## Editorial rhythm

- [ ] Density varies: large → quiet → dense → quiet → conversion. Never uniform.
- [ ] One dominant claim + one focal object + one CTA in the hero (no paragraph soup, no carousel/autoplay).

## Intentional mobile (375px)

- [ ] Mobile scene designed intentionally — reflow, not a stacked/squeezed desktop.
- [ ] At 375px: hierarchy preserved, first-viewport drama preserved, body ≥16px, motion restraint held.
- [ ] Heavy 3D has a static fallback at mobile width.
