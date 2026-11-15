# ADR-0003: The public catalog owns a skill name

**Date**: 2026-10-24 (Frank's ruling, recorded 2026-11-07)
**Status**: accepted, `[RULED]` - only Frank changes it
**Deciders**: Frank, in an OpenCode session; implemented in `tools/gen-skills-graph.mjs` and
`ops/skill-authority.json`, committed at the estate root as `23d676d`

## Context

Fifteen skill names were defined in both the ACOS-internal pack (`agentic-creator-skills`) and the
public catalog (`claude-skills-library`), with no authority rule. `tools/gen-skills-graph.mjs`
exited 1 on those 15 conflicts, so `graph/skills.graph.json` could not build and the skill hub had
no unambiguous install slug. The catalog is the surface with measured traffic (1,347 views /
721 uniques in the 14-day API window, `gh api .../traffic/views`, 2026-11-07).

## Decision

When the public catalog and the internal pack both define a name, `claude-skills-library` owns the
namespace. The internal pack keeps authoring; where its copy drifts ahead, the library copy is
refreshed **from** the pack. The graph never points at the mirror.

### Alternatives considered

**The internal pack owns the name**
- Pros: ACOS authors skills first; the freshest prose often starts there.
- Cons: buyers install from the catalog; an unversioned public name would point at a private pack.
- Why not: Frank ruled against it on 2026-10-24.

**Resolve the 15 one by one with overrides**
- Pros: fully deliberate, no blanket rule.
- Cons: 15 decisions, and the next mirror collision re-opens the same argument.
- Why not: it was offered as an option and not chosen; the blanket rule is reversible with one
  `overrides{}` entry if a specific skill needs one.

## Consequences

### Positive
- `gen-skills-graph.mjs` exits 0 today: 936 `SKILL.md` → 606 names, 0 conflicts, 15 resolved by
  `catalog-over-internal-pack`, 115 versioned, 30 with an eval.
- One install slug → one owning repo is now machine-readable; the catalog can be generated.

### Negative
- A skill edited only in the internal pack is invisible to buyers until the library copy is
  refreshed. A drift check is not yet built.
- 119 binding links resolve to external repos and one is broken (`skills/code-mode`), which the
  graph reports honestly rather than hiding.

### Risks
- Silent mirror drift. Mitigation: Phase 1 adds a content-hash comparison between the ruled owner
  and its mirrors; the scoreboard reports G2 as FAIL the moment a conflict returns.
