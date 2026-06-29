# Visual Audit — `<page-or-scene-name>`

> Purpose: the QA artifact at the gate. Score the rubric, attach screenshots, grep anti-patterns, record CWV + a11y, list fixes, give a verdict. Below target ⇒ iterate, don't ship (`taste.md`).

## Identity

- **Target:** `<page / scene>`
- **Route:** `<...>`
- **Build:** `<commit SHA / preview URL>`
- **Date:** `<YYYY-MM-DD>`

## Rubric scores (1–5, from `taste.md`)

> 1 = template/sloppy · 3 = decent but generic · 5 = premium/cinematic/ownable. Flagship: ≥4 every axis, 5 on focal axis.

| Axis | Score | Note | Target |
|---|---|---|---|
| Composition | `<n>` | `<...>` | `<4/5>` |
| Hierarchy | `<n>` | `<...>` | `<4/5>` |
| Typography | `<n>` | `<...>` | `<4/5>` |
| Color / material | `<n>` | `<...>` | `<4/5>` |
| Motion | `<n>` | `<...>` | `<4/5>` |
| 3D integration | `<n / n-a>` | `<...>` | `<4/5>` |
| Brand specificity | `<n>` | `<...>` | `<4/5>` |
| Originality | `<n>` | `<...>` | `<4/5>` |
| Polish | `<n>` | `<...>` | `<4/5>` |
| Performance perception | `<n>` | `<...>` | `<4/5>` |

- **Focal axis:** `<axis — must be 5>`
- **Lowest axis:** `<axis — drives the fix list>`

## Screenshots

- **1920:** `<path / link>`
- **1440:** `<path / link>`
- **768:** `<path / link>`
- **375:** `<path / link>`
- [ ] First viewport reads premium before scroll at every width.

## Anti-pattern grep results

| Check | Command | Result (pass/fail + hits) |
|---|---|---|
| Raw hex in app code | `<grep for #[0-9a-fA-F]{3,6}>` | `<...>` |
| Banned fonts | `<grep Inter / Space Grotesk / Cinzel>` | `<...>` |
| `domMax` (should be `domAnimation`) | `<grep domMax>` | `<...>` |
| Emoji / Unicode-glyph icons | `<grep ✦ ◈ ⌥ / emoji>` | `<...>` |
| Equal-card grid as content | `<manual / grep>` | `<...>` |
| `whileHover scale` spam | `<grep scale: 1.0[0-9]>` | `<...>` |
| TODOs in code | `<grep TODO>` | `<should be 0 — move to decision-log>` |

## Core Web Vitals

| Metric | Value | Budget | Pass? |
|---|---|---|---|
| LCP | `<...>` | `<≤2.5s>` | `<y/n>` |
| CLS | `<...>` | `<≤0.1>` | `<y/n>` |
| INP | `<...>` | `<≤200ms>` | `<y/n>` |
| Scroll fps | `<...>` | `<60>` | `<y/n>` |

## Accessibility results

- **Contrast (AA):** `<pass/fail + offenders>`
- **Keyboard / focus:** `<pass/fail>`
- **Reduced-motion path:** `<verified — reveals + beat + 3D>`
- **Icon-only labels / ARIA:** `<pass/fail>`
- **Tooling:** `<axe / Lighthouse a11y score>`

## Fix list

| # | Issue | Axis / area | Severity (blocker/major/minor) | Fix |
|---|---|---|---|---|
| 1 | `<...>` | `<...>` | `<blocker>` | `<...>` |
| 2 | `<...>` | `<...>` | `<minor>` | `<...>` |

## Verdict

- **Result:** `<PASS — ship | ITERATE — below target>`
- **Reason:** `<one line>`
- **If iterate:** next pass targets `<the lowest axes / blockers>` then re-audit.
