# Handover — `<session / scope>`

> Purpose: hand a build to the next session or agent cold. What changed, what ran, what shipped, what's open. Pair with `decision-log.md` (decisions live there; this is the session snapshot).

## Identity

- **Scope:** `<page / scene / component>`
- **Brand world:** `<Starlight | Arcanea | FrankX>`
- **Date:** `<YYYY-MM-DD>`
- **Branch:** `<agent/<harness>/<scope>>`
- **Build / preview:** `<commit SHA / preview URL>`

## Changed files

| File | Change | Status |
|---|---|---|
| `<app/.../page.tsx>` | `<...>` | `<done / wip>` |
| `<components/...>` | `<...>` | `<...>` |
| `<_intelligence/templates/... or decision-log.md>` | `<spec/log updated>` | `<...>` |

## Commands run + results

| Command | Result |
|---|---|
| `<build>` | `<pass / fail + error>` |
| `<typecheck / lint>` | `<clean / N errors>` |
| `<test>` | `<pass / fail>` |
| `<release-check.md>` | `<pass / iterate>` |

## Rubric scores summary (from `visual-audit.md`)

| Axis | Score | Axis | Score |
|---|---|---|---|
| Composition | `<n>` | 3D integration | `<n/na>` |
| Hierarchy | `<n>` | Brand specificity | `<n>` |
| Typography | `<n>` | Originality | `<n>` |
| Color / material | `<n>` | Polish | `<n>` |
| Motion | `<n>` | Performance perception | `<n>` |

- **Verdict:** `<pass / iterate>` · **Focal axis:** `<axis @ 5?>`

## Shipped vs deferred

- **Shipped:** `<what is live/merged and verified>`
- **Deferred:** `<what was scoped out and why>`

## Open decisions / TODOs

> No TODOs in code — they live here and in `decision-log.md`.

| # | Item | Type (decision/todo) | Owner | Points to |
|---|---|---|---|---|
| 1 | `<...>` | `<decision>` | `<...>` | `<decision-log.md#entry>` |
| 2 | `<...>` | `<todo>` | `<...>` | `<...>` |

## Next moves

1. `<the first thing the next session should do>`
2. `<...>`

## Verification state

- [ ] Builds clean (not just `dev`); TypeScript clean.
- [ ] Reduced-motion + mobile (375px) + 3D-fallback verified.
- [ ] Committed page spec describes what shipped.
- [ ] `decision-log.md` updated (incl. any new deps).
