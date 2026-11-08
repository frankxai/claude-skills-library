# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE (MIT derivative)** — a condensed derivative
of the claude-flow `verification-quality` skill; upstream licence verified MIT,
so commercial redistribution is permitted **provided the upstream copyright and
permission notice travel verbatim with the skill in any bundle** (manifest
bundling rule 4).

## Files covered

- `SKILL.md` — `sha256` at this record's commit: `42917b99ca2155d602a8536d1976e8d5cdf6cb1bd0d4c19603c8c310f837bf99`
- `references/guide.md` — estate progressive-disclosure split (`5e17d21`, 2026-06-08); instructive prose only, no bundled scripts

## In-repo history

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/verification-quality/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ... (#102)
# 5e17d21 2026-06-08 Frank Phase 4 (batch 3): progressive-disclosure splits for 11 more skills (#8)
# 07e270e 2026-06-08 Frank Make the library world-class ... (#4)
# 468c26e 2026-05-25 frankx-eth chore: sync skills from FrankX - 2026-05-25 (arrival: 649 lines)
```

## Upstream derivation (what was verified, 2026-11-08)

| | |
|---|---|
| Upstream file | `.claude/skills/verification-quality/SKILL.md` in `ruvnet/ruflo` (claude-flow, renamed from `ruvnet/claude-flow`). https://github.com/ruvnet/ruflo/blob/main/.claude/skills/verification-quality/SKILL.md |
| Upstream licence | **MIT**, verified via GitHub licence API (`gh api repos/ruvnet/ruflo` → `license.spdx_id = "MIT"`); upstream LICENSE text begins *"Copyright (c) 2024-2026 ruvnet"* |
| Pinned commit used for the comparison | `388665d67c7b4c54c6e82ec27b6b3c660af9a304` (2026-05-21, the upstream state four days before this repository's 2026-05-25 sync commit) |
| Derivation measurement | Comparing our `SKILL.md` (as at `c6d5aeb`) line-wise against the upstream file at the pinned commit: **77 of our 103 non-empty lines (74.8%) are identical** after whitespace trimming |
| The manifest's tooling coupling | The manifest read `npx claude-flow@alpha …` commands as a third-party coupling; this record resolves it: the coupling is the upstream lineage itself |

## Known content drift (flagged, not blocking)

The upstream file at current `main` has moved on twice: it is rebranded to
`ruflo` and states the truth-scoring and auto-rollback CLI surfaces are
*"design notes, not shipped CLI commands"*. Our copy still teaches
`npx claude-flow@alpha truth/verify/rollback` as executable. That is a
functional-accuracy risk for bundle maintainer attention; it does not affect
licence validity (derivation is established from the 2026-05-21 pinned state).

## Licence conditions for any bundled copy

1. Keep this record with the skill.
2. Output notice: upstream MIT licence text is *"Copyright (c) 2024-2026
   ruvnet"* (https://github.com/ruvnet/ruflo/blob/main/LICENSE); it must travel
   verbatim in the bundle's licence file for this skill.
3. The estate's condensed splits and frontmatter remain under this repository's
   MIT (`LICENSE`, © 2025-2026 Frank Riemer and contributors).
