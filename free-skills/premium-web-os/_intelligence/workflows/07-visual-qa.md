# 07 — Visual QA

**Purpose:** Score the taste rubric and run the design-verifier discipline; iterate until the scene hits target.

## Inputs

- The built scene (static + motion, + 3D if specified).
- [`../taste.md`](../taste.md) — the 1–5 rubric + targets.
- [`../templates/visual-audit.template.md`](../templates/visual-audit.template.md) — the audit shape.
- [`../checklists/taste-check.md`](../checklists/taste-check.md) — rubric scoring checklist.
- [`../quality-gates.md`](../quality-gates.md) — Gate 3 (ship-time verification).

## Steps

1. **Capture screenshots at 1920 / 1440 / 768 / 375** (Playwright, against a real preview build). These are the audit evidence.
2. **Score the rubric** in [`../templates/visual-audit.template.md`](../templates/visual-audit.template.md) using [`../checklists/taste-check.md`](../checklists/taste-check.md): every axis 1–5, focal axis target 5, floor ≥ 4 for a flagship.
3. **Run the anti-pattern grep** (the design-verifier discipline): banned fonts (Inter / Space Grotesk / Cinzel), raw hex in app code, `domMax`, purple-on-white SaaS gradients, emoji/Unicode-glyph icons, centered-everything, equal-card grids. Any hit is a defect.
4. **Run Lighthouse** on the preview for a first read on perf + a11y (full budget pass is [`08-performance-pass.md`](./08-performance-pass.md)).
5. **Fix loop:** for every axis below target and every anti-pattern hit, fix and re-capture. Do not rationalize a low score — re-read [`../taste.md`](../taste.md) and iterate.
6. **Confirm states + responsiveness** in the screenshots: loading/empty/error/success render; 375px is a real layout; reduced-motion path intact.

## Output / artifact

A completed **visual audit** (from the template): per-axis scores, screenshots at 4 widths, anti-pattern grep result (clean), and the fix log.

## Gate

Rubric ≥ target on every axis (5 on focal); anti-pattern grep clean; all four widths render correctly; states verified. Any miss → iterate, don't advance.

## Next

[`08-performance-pass.md`](./08-performance-pass.md)
