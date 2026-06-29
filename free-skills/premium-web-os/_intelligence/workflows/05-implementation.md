# 05 — Implementation (Static)

**Purpose:** Build the static composition first — layout, type, hierarchy, color from tokens. The page must be premium *frozen*, before anything moves.

## Inputs

- The page spec from [`04-build-plan.md`](./04-build-plan.md) + the scene briefs.
- [`../taste.md`](../taste.md) — hierarchy, typography, color/material, silence, first-viewport.
- [`../implementation-standards.md`](../implementation-standards.md) — code conventions.
- [`../design.md`](../design.md) + the brand token source.

## Steps

1. **Lay out the grid and the asymmetry break** per each scene brief. Hold the 40–60% quiet zones — do not fill them.
2. **Set typography first.** Establish the display moment and the body ramp; get type carrying the authority before reaching for effects (taste principle 5).
3. **Apply color + material from tokens.** Token names only — **no raw hex in app code**. Consistent radii and shadows; a controlled palette (base + ≈2 accents).
4. **Build the components and all their states** from the spec's state matrix: loading / empty / error / success, plus hover/focus/disabled — as static styling, no motion yet.
5. **Make it responsive as you build.** Verify 375px is a real layout, not a crush. Don't defer mobile.
6. **No motion, no 3D yet.** A weak composition must be exposed now, not hidden by movement. Render any 3D slot as its **static poster** placeholder.
7. **Self-score against the rubric** in [`../taste.md`](../taste.md) (Gate 2 in [`../quality-gates.md`](../quality-gates.md)). Below target on composition/hierarchy/type/color → iterate here; do not advance to motion on a weak static.
8. **Verify it builds** (production build, not just `dev`) and TypeScript is clean before moving on.

## Output / artifact

The **static composition** of every scene: responsive, token-bound, all states present, 3D as poster, building clean.

## Gate

Build + types clean; taste rubric ≥ target on the static axes (composition, hierarchy, typography, color/material); 375px verified; zero raw hex; no motion/3D added yet.

## Next

[`06-motion-pass.md`](./06-motion-pass.md)
