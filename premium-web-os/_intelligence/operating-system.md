# Operating System

How the Premium Web OS works, and the sequence every build follows.

## The premise

Agents are strong at implementation and weak at taste, hierarchy, motion restraint, and performance discipline. This OS converts those weak spots into explicit, checkable constraints. The agent's job is not to be creative from nothing — it is to **execute a locked system with judgment**.

## The control loop

```
INTAKE → REFERENCE → ART DIRECTION → SCENE BRIEF → STATIC BUILD
   → MOTION → 3D → POLISH → VISUAL QA → PERFORMANCE → RELEASE GATE → HANDOVER
```

Each step has a workflow doc (`workflows/00..09`), and most produce an artifact (a template under `templates/`). The loop is gated: you do not advance past a gate that fails.

### Why this order

- **Static before motion before 3D.** A page must be premium *frozen* before anything moves. Motion and 3D amplify a strong composition and expose a weak one. Building them first hides structural problems.
- **Brief before build.** The scene brief converts the vague adjective ("cinematic") into layout/material/motion/type constraints (the Agent Translation Rule in `taste.md`). No brief → no build.
- **Gate before ship.** The release checklist aggregates taste, design, motion, 3D, performance, and accessibility into one pass/fail.

## The three contracts

1. **Taste contract** (`taste.md`) — the 10 principles + the 1–5 rubric. A scene must score at or above its target before it ships.
2. **Token-binding contract** (`brand-worlds.md` + `design.md`) — concrete color/type/space values come from the brand's real token source, never invented inline. The OS defines *categories*; the brand defines *values*.
3. **Quality contract** (`quality-gates.md`) — which gates fire when, wiring the existing `plan-design-review` (plan time) and `design-verifier` (ship time).

## Roles (single-agent or multi-agent)

The same phases run whether one agent does everything or a swarm divides it:

| Phase | Single-agent | Multi-agent (if repo has the agents) |
|---|---|---|
| Art direction + brief | you | `design-architect` |
| Static build / variants | you | `design-generator` |
| Motion | you | `design-motion` |
| QA / verify | you | `design-verifier` |

See `agent-manual.md` for the dispatch detail and graceful degradation.

## What "done" means

A build is done when:
- it builds (production build, not just dev) and TypeScript is clean;
- `checklists/release-check.md` passes;
- reduced-motion, mobile (375px), and 3D-fallback states are verified;
- the committed page spec matches what shipped;
- the decision log records any dependency additions, deferrals, or open TODOs.

## Mirroring into a repo

When mirrored into a web repo, `_intelligence/` is tuned to that repo: its `taste.md`/`design.md`/`brand-worlds.md` cross-reference the repo's own canon (e.g. Arcanea `TASTE.md` / `@arcanea/design-system`) rather than duplicating values. The build sequence and gates are identical everywhere.
