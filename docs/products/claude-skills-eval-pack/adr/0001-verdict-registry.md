# ADR-0001: Verdicts live in a separate machine-readable registry

**Date**: 2026-10-25 (backfilled 2026-11-07)
**Status**: accepted
**Deciders**: the estate's O5 eval work; this ADR records, it does not re-decide

## Context

`tools/gen-skills-graph.mjs` needs one eval verdict per skill name. Putting verdicts in each
`SKILL.md` frontmatter would spread them across 936 files in six repos, make the graph re-read
every skill on every build, and let a stale file claim a PASS. A verdict is also a dated claim
about a specific revision, so it needs a receipt pointer.

## Decision

Keep verdicts in `starlight/ops/skill-eval-verdicts.json` with top-level counts, an `updatedAt`,
and per-skill `verdict`, `evaluatedAt`, `deterministicPass`, `plantedFaultsCaught` and `receipt`.
`tools/eval-skills-suite.mjs` generates it; `tools/gen-skills-graph.mjs` consumes it.

### Alternatives considered

**Frontmatter in each `SKILL.md`**
- Pros: travels with the skill, no second file.
- Cons: 936 edit surfaces, no single integrity check, a copied skill inherits a stale PASS.
- Why not: the resolver already treats most copies as mirrors; a verdict must name one owner.

**A hosted database**
- Pros: queryable, concurrent writes.
- Cons: new credential, new runtime, personal data boundary, a service to keep alive.
- Why not: the estate has no measured demand for one and the gates keep money paths closed.

**Inline in `graph/skills.graph.json`**
- Pros: one artifact.
- Cons: the graph is generated from the verdicts, not the other way round; writing into a
  generated file makes provenance circular.
- Why not: it would erase the distinction between a measurement and its source.

## Consequences

### Positive
- One integrity check: `counts.withEval` must equal registry `passed`.
- A missing receipt is a detectable fault, not a prose note.
- The catalog reads one generated graph instead of parsing run output.

### Negative
- Two files must stay in sync; a hand-edited verdict breaks them.
- The registry lives in the estate control plane, so a product repo lane cannot write it.

### Risks
- A verdict can outlive the `SKILL.md` revision it covers. Mitigation: Phase 1 adds a staleness
  check comparing `evaluatedAt` with the owner file mtime; a stale verdict is reported, not
  silently trusted.
