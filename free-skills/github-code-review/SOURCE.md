# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE (MIT derivative)** — a condensed derivative
of the claude-flow `github-code-review` skill; upstream licence verified MIT,
so commercial redistribution is permitted **provided the upstream copyright and
permission notice travel verbatim with the skill in any bundle** (manifest
bundling rule 4).

## Files covered

- `SKILL.md` — `sha256` at this record's commit: `ef0111cb7b6469ee8cafb87624634658413e8d0359aea4a955920dec871b4262`
- `references/reference.md` — estate progressive-disclosure split (`1eaabad`, 2026-06-08); instructive prose only, no bundled scripts

## In-repo history

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/github-code-review/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ... (#102)
# 22ea80b 2026-09-27 Frank fix(links): repair broken links, make link checker green (#37)
# 1eaabad 2026-06-08 Frank Phase 4 (batch 2): progressive-disclosure splits for 6 more skills (#7)
# 07e270e 2026-06-08 Frank Make the library world-class ... (#4)
# 468c26e 2026-05-25 frankx-eth chore: sync skills from FrankX - 2026-05-25 (arrival: 1140 lines)
```

## Upstream derivation (what was verified, 2026-11-08)

| | |
|---|---|
| Upstream file | `.claude/skills/github-code-review/SKILL.md` in `ruvnet/ruflo` (claude-flow, renamed from `ruvnet/claude-flow`). https://github.com/ruvnet/ruflo/blob/main/.claude/skills/github-code-review/SKILL.md |
| Upstream licence | **MIT**, verified via GitHub licence API (`gh api repos/ruvnet/ruflo` → `license.spdx_id = "MIT"`); upstream LICENSE text begins *"Copyright (c) 2024-2026 ruvnet"* |
| Pinned commit used for the comparison | `388665d67c7b4c54c6e82ec27b6b3c660af9a304` (2026-05-21, the upstream state four days before this repository's 2026-05-25 sync commit) |
| Derivation measurement | Comparing our `SKILL.md` (as at `c6d5aeb`) line-wise against the upstream file at the pinned commit: **147 of our 178 non-empty lines (82.6%) are identical** after whitespace trimming |
| Corroborating markers | Frontmatter `author: "Claude Code Flow"`, `requires: "github-cli, ruv-swarm, claude-flow"`; body commands `npx ruv-swarm …` and `mcp__claude-flow__…` |

Our copy is not a byte-copy: it condenses the upstream workflow and its own
frontmatter was written in-estate, but its shared text establishes the upstream
lineage beyond doubt.

## Licence conditions for any bundled copy

1. Keep this record with the skill.
2. Output notice: upstream MIT licence text is *"Copyright (c) 2024-2026
   ruvnet"* (https://github.com/ruvnet/ruflo/blob/main/LICENSE); it must travel
   verbatim in the bundle's licence file for this skill.
3. The estate's condensed splits, link fixes and frontmatter remain under this
   repository's MIT (`LICENSE`, © 2025-2026 Frank Riemer and contributors).
