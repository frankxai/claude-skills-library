# 09 — Handover

**Purpose:** Close the build with a durable handover and an updated decision log, so the next session or reviewer can pick up cold.

## Inputs

- Everything produced through [`08-performance-pass.md`](./08-performance-pass.md).
- [`../templates/handover.template.md`](../templates/handover.template.md) — the handover shape.
- [`../checklists/release-check.md`](../checklists/release-check.md) — the single release gate.
- [`../decision-log.md`](../decision-log.md) — durable decisions + TODOs.

## Steps

1. **Run the single release gate** in [`../checklists/release-check.md`](../checklists/release-check.md): build green · types clean · taste rubric ≥ target · design-check · motion-check · webgl-check (if 3D) · performance budget · accessibility · reduced-motion + 375px + 3D-fallback verified. One pass/fail — do not hand over on a fail.
2. **Confirm the committed page spec matches what shipped.** If the build diverged from the spec, update the spec — the artifact must describe reality.
3. **Run the available lint/typecheck/build/test commands** and record them with their results. Fix failures your work introduced.
4. **Write the handover** from [`../templates/handover.template.md`](../templates/handover.template.md): changed files, commands run + results, rubric scores per scene, CWV numbers, next moves, and open items.
5. **Update [`../decision-log.md`](../decision-log.md):** any dependency added (with justification), deferrals, open TODOs (owner + reason — TODOs live here, never in code), and notable art-direction/trade-off decisions.
6. **State assumptions and anything unverified** explicitly in the handover — don't present a guess as a fact.

## Output / artifact

A committed **handover doc** (from the template) + an updated **decision log**, with the release gate marked pass.

## Gate

Release gate passes; page spec matches shipped reality; lint/typecheck/build/test recorded; decision log updated; no TODOs left in code.

## Next

Done. For the next page/scene, return to [`00-intake.md`](./00-intake.md).
