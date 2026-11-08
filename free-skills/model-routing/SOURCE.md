# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE (MIT derivative)** — a derivative work of the
claude-flow intelligent-routing pattern; upstream licence verified MIT, so
commercial redistribution is permitted **provided the upstream copyright and
permission notice travel verbatim with the skill in any bundle** (manifest
bundling rule 4).

## Files covered

- `SKILL.md` — `sha256` at this record's commit: `ba4f82968abcf25dbd9627fcb022a76bb43ef29a67726f57806c3c0e992fce8e`
- `routing-rules.json` — estate-adapted data file, `_source: "claude-flow Q-Learning Router pattern + model-registry.json"`

## In-repo history

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/model-routing/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ... (#102)
# d800c14 2026-09-19 Frank fix: correct stale model facts and add the agent-infrastructure pack (#26)
# 279de9d 2026-06-22 Frank Model-currency pass: current Claude family ... (#11) — model facts re-verified, footer dated 2026-08-28
# 07e270e 2026-06-08 Frank Make the library world-class ... (#4)
# 468c26e 2026-05-25 frankx-eth chore: sync skills from FrankX - 2026-05-25 (arrival: 163 lines + routing-rules.json)
```

## Upstream (what was verified, 2026-11-08)

| | |
|---|---|
| Upstream project | claude-flow — repo `ruvnet/ruflo` (renamed from `ruvnet/claude-flow`; old name resolves to the same repo). https://github.com/ruvnet/ruflo |
| Upstream licence | **MIT**, verified via GitHub licence API (`gh api repos/ruvnet/ruflo` → `license.spdx_id = "MIT"`, 81,193 stars, pushed 2026-11-07) |
| Derivation evidence in our file | Frontmatter `metadata: source: "claude-flow"`; body footer *"Model Routing v1.1 - Implementing claude-flow's intelligent routing pattern"*; `routing-rules.json` `_source` field |
| Upstream artifacts the pattern traces to (on `main`, HEAD `3fe9d70ba7d08ff12233003a9342037ab80af3ce`, 2026-11-06, verified via GitHub code search API) | `v3/@claude-flow/cli/src/ruvector/q-learning-router.ts`, `v3/@claude-flow/cli/src/ruvector/model-router.ts`, `v3/@claude-flow/cli/data/model-registry.json`, `v3/@claude-flow/cli/src/commands/route.ts` |

The skill is not a copy of an upstream prose file (no matching
`.claude/skills/model-routing/` exists upstream); it is an estate-authored
prose skill implementing a claude-flow code pattern, then substantially revised
in-estate (model-currency pass re-verified model IDs and pricing 2026-08-28;
stale-facts fix 2026-09-19). The MIT licence of the upstream pattern applies and
permits this derivative use.

## Licence conditions for any bundled copy

1. Keep this record with the skill.
2. Output notice: upstream MIT licence text is
   *"Copyright (c) 2024-2026 ruvnet"* (verified from
   https://github.com/ruvnet/ruflo/blob/main/LICENSE, 2026-11-08); it must
   travel verbatim in the bundle's licence file for this skill.
3. The estate's own prose and data edits remain under this repository's MIT
   (`LICENSE`, © 2025-2026 Frank Riemer and contributors).
