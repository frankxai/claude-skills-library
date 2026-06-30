# Accessibility

Premium includes everyone. Accessibility is a gate, not a nice-to-have. Target **WCAG 2.2 AA** (AAA where the brand canon demands it).

## Non-negotiables

- **Contrast:** body text ≥ 4.5:1, large text/UI ≥ 3:1. Dark themes still must pass — atmospheric ≠ low-contrast.
- **Keyboard:** every interactive element reachable and operable; visible focus state (never `outline: none` without a replacement); logical tab order.
- **Reduced motion:** `prefers-reduced-motion` honored for every reveal, scroll beat, ambient drift, and 3D scene (static/minimal equivalent).
- **Semantics:** real landmarks (`header/nav/main/footer`), one `h1`, no heading-level skips, `alt` on meaningful images (empty `alt` on decorative), labels on inputs (no placeholder-as-label).
- **Targets:** ≥ 44px touch targets.
- **Motion safety:** no rapid flashing; parallax/auto-motion has a stop or reduced-motion path.
- **3D/Canvas:** provide a text/poster alternative; never trap focus inside a canvas.

## Verification

Lighthouse a11y + manual keyboard pass + reduced-motion pass + a screen-reader smoke test on the hero and primary CTA. Full: `checklists/release-check.md`.
