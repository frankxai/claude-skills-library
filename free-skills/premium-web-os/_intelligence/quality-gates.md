# Quality Gates

The OS does not invent new review tools — it **wires the gates that already exist** and adds the taste rubric. Three gates fire at three moments.

## Gate 1 — Plan-time design review (before building)

Wraps gstack **`plan-design-review`** (7 rating passes, AI-slop detection, 9 cognitive patterns). Run against the page spec + scene brief.

- Rates 0–10: information architecture · interaction-state coverage · journey/emotional arc · AI-slop risk · design-system alignment · responsive & accessibility · unresolved decisions.
- AI-slop flags: purple/violet gradients, 3-column icon-card grids, centered-everything (>60%), uniform bubbly radius, generic hero copy.
- Output: fix the plan until each dimension hits target **before** code.

## Gate 2 — Build-time taste rubric (during/after static build)

Score `taste.md`'s 1–5 rubric via `checklists/taste-check.md`. Flagship targets ≥4 every axis, 5 on the focal axis. Below target → iterate; do not advance to motion/3D on a weak composition.

## Gate 3 — Ship-time verification (before merge)

Wraps the Arcanea **`design-verifier`** discipline:

- Playwright screenshots at **1920 / 1440 / 768** (+ 375 mobile).
- Lighthouse on a preview build (perf + a11y).
- Anti-pattern grep: banned fonts (Inter/Space Grotesk/Cinzel), raw hex in app code, `domMax`, purple-on-white gradients, emoji/glyph icons.
- Any hit **blocks merge**.

## The single release gate

`checklists/release-check.md` aggregates everything: build green · types clean · taste rubric ≥ target · design-check · motion-check · webgl-check (if 3D) · performance budget · accessibility · reduced-motion + mobile + fallback verified · decision log updated. One pass/fail.

## Degradation

If a repo lacks the gstack skill or the verifier agent, run the equivalent **checklist** in `checklists/` manually. The gate still fires; only the automation differs.
