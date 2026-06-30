# 03 — Scene Brief

**Purpose:** Turn the art direction into a per-scene buildable brief. No scene is built without one.

## Inputs

- The art-direction lock from [`02-art-direction.md`](./02-art-direction.md).
- [`../templates/scene-brief.template.md`](../templates/scene-brief.template.md) — the brief shape.
- [`../taste.md`](../taste.md) — rubric targets + the Visual Silence and First Viewport rules.
- [`../brand-worlds.md`](../brand-worlds.md) — token names for this scene.

## Steps

1. **One brief per scene.** A scene = a viewport-scale beat (hero, a pinned moment, a feature scene). Copy [`../templates/scene-brief.template.md`](../templates/scene-brief.template.md) for each.
2. **Fill the dominant idea + focal point.** Exactly one focal point; everything else is named as support.
3. **Specify the composition:** grid, the deliberate asymmetry that breaks it, gutters, and the quiet zones (40–60%). For the first scene, satisfy the First Viewport Rule explicitly.
4. **Bind concrete values:** palette token names, type ramp, materials, spacing — all from the brand token source. No raw hex, no invented scale.
5. **State motion intent + reduced-motion intent** for this scene (one beat; what the reduced-motion user gets instead). Build detail is deferred to [`06-motion-pass.md`](./06-motion-pass.md).
6. **State the 3D metaphor + fallback** if any: the metaphor, the static poster, the mobile simplification, the reduced-motion state. If none, write "none".
7. **Set rubric targets** for this scene: focal axis = 5, floor ≥ 4 (or the explicit secondary-scene targets).
8. **List copy slots** (display line, sub-line, CTA) with character intent — strong nouns, short lines, no paragraph in the hero.

## Output / artifact

A completed **scene brief** per scene (from the template), committed alongside the page spec.

## Gate

Every scene has a brief; each names one focal point, binds real tokens, declares motion + 3D fallback intent, and sets rubric targets. **No brief → no build.**

## Next

[`04-build-plan.md`](./04-build-plan.md)
