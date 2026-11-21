# Handoff: Kade v3.1 (`pages/after.html`)

Verifier's record. Every check names its evidence; a check that could not run says so.

## Verdict: **block on owner gates**; nothing open on the maker

The maker's work is done (no open P0 or P1 from any layer). The page cannot ship to its buyer
until the owner answers gates 1 and 2 below, because the page's one action, a viewing, has no
confirmed object yet. That is a person's decision, so per `agents/release-verifier.md` the
verdict is **block**, not ship.

## Scores, start to finish

| Layer | v1 | v3.1 | Evidence |
|---|---|---|---|
| Machine | 19.5 / 30 | 28.5 / 30 | `evidence/before/scan.json`, `evidence/after/scan.json` |
| Browser | 8.5 / 25 | 25 / 25 | `evidence/before/eye.json`, `evidence/after/eye.json` |
| Eye (critic) | 5 / 50 | 36 / 50 | [critique.md](critique.md) rounds 1 and 3 |

Both measured scores are up; the eye score is in the iterate band (30 to 39), short of the
ship band (40+). The gap is the owner gates (imagery, real plans, viewing), not open defects.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Reduced motion renders a designed state | pass: no animation exists | `evidence/after/375-reduced-motion.png`; `eye.json` `reduced.running: 0` |
| No content hidden in server HTML or at opacity 0 | pass | `scan.json` (no `opacity-zero`); `eye.json` no `hidden-at-rest` |
| Viewport, zoom, safe area, targets at 375 | pass: no sideways scroll, every target 44 px or more | `eye.json` mobile 5/5; `scan.json` mobile 4/5 (manifest and touch icon absent: fixture) |
| One h1, landmarks, visible focus | pass: 7 of 7 keyboard stops change visibly | `eye.json` `focus` |
| Contrast, light and dark | pass on solid backdrops in both schemes | `eye.json` access 5/5; `dark.measuredText: 39` |
| Contrast over imagery | not applicable: no text sits on the illustration | `eye.json` (no `contrast-unverified`) |
| Core Web Vitals (lab, phone, 4x CPU, slow 4G) | pass: LCP under 0.5 s, CLS 0, TBT 0 | `eye.json` `metrics.perf` |
| Core Web Vitals (field) | **not run**: a fixture has no field data | |
| Repo build, lint, typecheck | not applicable: static HTML, no build | |
| JSON-LD parses and matches visible content | pass: Organization and Product with `minPrice`; the FAQPage was dropped with the visible FAQ | `pages/after.html` |
| Critique P0 and P1 answered | pass | [critique.md](critique.md) round 3 |
| Different-provider critique | **not run**: no second provider installed | [critique.md](critique.md) header |

## Owner gates

1. **Viewing**: the real address and dates, and what exists to view (yard, mock-up or a launched unit).
2. **Plans**: construction drawings, to replace the illustrative layout and its caption.
3. **Imagery**: photographs of the yard, the build or a finished unit, through the media desk.
4. **Type**: a licensed serif, so headings stop depending on installed fonts.

## Accepted, not fixed

- About 130 px of empty column under the plan card at 1440: the spec list is taller than the drawing. Fixing it means inventing content or shrinking the spec type.
- Manifest and touch icon (machine scan P2): out of scope for a fixture.
