# Pack provenance remediation

Author: agent lane `flash-5603474e` (`agent/flash/skill-provenance`) · 2026-11-08 · all evidence gathered in worktree at `origin/main` `c6d5aeb6823652eab1006387632296c7a8f38ae7`.

Remediates the six `NEEDS-REVIEW` entries (eight skills) in
`docs/pack-license-manifest.md` (authored by lane `flash-a54c7a54`). Every
candidate skill now carries a written provenance record in its own
`SOURCE.md`. No licence was guessed: every third-party licence below was
verified live against GitHub's API the day it was recorded.

## Verdict table

| Skill | Verdict | Evidence (all verified 2026-11-08) |
|---|---|---|
| ui-ux-design-expert | **CLEARED** | In-estate: created by Frank at `4edecaf` (2025-10-25, initial release v1.0.0, 717 lines); no third-party marker in file or frontmatter. Record: `free-skills/ui-ux-design-expert/SOURCE.md` |
| nextjs-expert | **CLEARED** | In-estate via FrankX estate sync at `468c26e` (2026-05-25); body's own header "Author: FrankX AI Systems", "Last Updated 2026-05-13" predates the sync; body de-personalised the same day (see below). Record: `free-skills/nextjs-expert/SOURCE.md` |
| mcp-architecture | **CLEARED** | In-estate: created by Frank at `4edecaf` (2025-10-25, 472 lines); no third-party marker. Record: `free-skills/mcp-architecture/SOURCE.md` |
| product-management-expert | **CLEARED** | In-estate: stub at `a2fdac9` (2025-10-31, **0 lines**), content authored in-repo by estate contributor copilot-swe-agent[bot] at `7e49dea` (2026-06-05, "fill stub skills"). Record: `free-skills/product-management-expert/SOURCE.md` |
| model-routing | **CLEARED (MIT derivative)** | Not cleared as estate-original: its own `source: "claude-flow"` frontmatter and `_source` in `routing-rules.json` claim claude-flow lineage. Upstream verified: claude-flow = `ruvnet/ruflo` (renamed repo), licence **MIT** (`gh api repos/ruvnet/ruflo` → `spdx_id: MIT`); pattern traced to real upstream code (`v3/@claude-flow/cli/src/ruvector/q-learning-router.ts`, `model-router.ts`, `data/model-registry.json` on main `3fe9d70b`). Upstream LICENSE: *"Copyright (c) 2024-2026 ruvnet"*. Record: `free-skills/model-routing/SOURCE.md` |
| github-code-review | **CLEARED (MIT derivative)** | Frontmatter `author: "Claude Code Flow"`, `requires: "github-cli, ruv-swarm, claude-flow"`. Upstream file `.claude/skills/github-code-review/SKILL.md` verified in `ruvnet/ruflo` (MIT); at pinned commit `388665d67c7b4c54c6e82ec27b6b3c660af9a304` (2026-05-21, four days before our sync commit) **147 of our 178 non-empty lines (82.6%) are identical**. Record: `free-skills/github-code-review/SOURCE.md` |
| verification-quality | **CLEARED (MIT derivative)** | No frontmatter marker, but the body teaches `npx claude-flow@alpha` — that tooling coupling *is* the lineage. Upstream `.claude/skills/verification-quality/SKILL.md` verified in `ruvnet/ruflo` (MIT); at pinned commit `388665d67c7b…` **77 of our 103 non-empty lines (74.8%) are identical**. Record: `free-skills/verification-quality/SOURCE.md` |
| feynman-thinking | **CLEARED** | In-estate: created by Frank at `5d4ee7a` (2026-08-20, "feat(free-skills): todo-discipline + free pack polish", 56 lines, same commit as the already-cleared `todo-discipline`); no claude-flow/ruv-swarm/community attribution anywhere in the file — the manifest's community-derivation concern is not supported by any marker or history. Record: `free-skills/feynman-thinking/SOURCE.md` |

**No skill was excluded.** Fastest path to the target: 4 previously cleared
(`todo-discipline`, `ai-architect-review` + the ten signed-off MIT
`packs/web-excellence` skills recorded in the manifest) plus any five of the
eight today = **ten or more with every one individually evidenced.**

## Commands that established each in-estate authorship claim

Run in the `skills-provenance` worktree at `c6d5aeb`:

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/ui-ux-design-expert/SKILL.md
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/nextjs-expert/SKILL.md
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/mcp-architecture/SKILL.md
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/product-management-expert/SKILL.md
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/model-routing/SKILL.md
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/github-code-review/SKILL.md
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/verification-quality/SKILL.md
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/feynman-thinking/SKILL.md
```

Earliest-content confirmation (the product-management-expert stub discovery):

```bash
git show 4edecaf --stat --format="" | Select-String "ui-ux-design-expert|mcp-architecture"   # 472/717 lines added
git show a2fdac9 --stat --format="" | Select-String "product-management-expert"              # 0 lines (stub)
git show 7e49dea --stat --format="" | Select-String "product-management-expert"              # 66 lines (filled in-repo)
git show 468c26e --stat --format="" | Select-String "nextjs-expert|model-routing|github-code-review|verification-quality"
git show 5d4ee7a --stat --format="" | Select-String "feynman|todo-discipline"                # 56/27 lines, Frank-authored
```

Upstream verification commands used for the three derivative clears:

```bash
gh api repos/ruvnet/ruflo --jq "{name: .full_name, license: .license.spdx_id}"        # MIT, renamed from claude-flow
gh api repos/ruvnet/ruflo/contents/LICENSE                                            # "Copyright (c) 2024-2026 ruvnet"
gh api "repos/ruvnet/ruflo/contents/.claude/skills" --jq ".[].name"                   # github-code-review + verification-quality listed
gh api "repos/ruvnet/ruflo/contents/.claude/skills/<skill>/SKILL.md?ref=388665d67c7b"  # pinned-state comparison source
gh api "repos/ruvnet/ruflo/commits?path=.claude/skills/<skill>/SKILL.md&until=2026-05-25T23:59:59Z"  # pinned historical commit
gh api "search/code?q=repo:ruvnet/ruflo+%22Q-Learning%22+router" --jq ".items[].path"  # model-routing pattern artifacts
gh api "search/code?q=repo:ruvnet/ruflo+model-registry" --jq ".items[].path"          # model-registry.json location
```

Derivation measurement method: every non-empty line of our `SKILL.md`
(as at `c6d5aeb`) whitespace-trimmed and membership-tested against the trimmed
non-empty line set of the upstream file at the pinned commit. 82.6% (GCR) and
74.8% (VQ) of our lines are identical to upstream text of the same commit
window; this is a rewrite-derivative, not a mirror.

## nextjs-expert de-personalisation (same day, same commit)

Smallest edits that remove Frank-private platform claims, keeping all technical
content: "React: 18.3 stable on FrankX" → "…in production"; "FrankX currently
uses `vercel.json` + `next.config.mjs`" → "…still works for simple cases. Move
to `vercel.ts` when you need …"; the parenthetical "(FrankX uses this — …)" →
generic. The `**Author:** FrankX AI Systems` line stays — it is the authorship
record, not a config preference. Details recorded in
`free-skills/nextjs-expert/SOURCE.md`.

## Substitutes — suggestions only, nothing moved or copied

Today's clears mean no substitution is needed for the ten-skill count. **If
Frank rejects the MIT-derivative extension of bundling rule 4** (which this
remediation applies to model-routing, github-code-review and
verification-quality), those three drop out and the pool loses three of eight —
the clean count is then 4 prior + 5 today = **nine**. Suggested substitute #10,
from the manifest's already-signed-off MIT set in `packs/web-excellence`
(each with an `UPSTREAM-LICENSE` whose text grants distribute/sell):

1. `packs/web-excellence/brandkit` (MIT, © 2026 Leonxlnx)
2. `packs/web-excellence/extract-design-system` (MIT, © 2026 Arvind)
3. `packs/web-excellence/ui-ux-pro-max` (MIT, © 2024 Next Level Builder)

Avoid `web-design-guidelines` as the substitute — it is the manifest's residual
NEEDS-REVIEW edge (MIT rests on a README declaration recorded by script, not a
licence file at the pinned commit). Suggested substitutes are skill *types*
available in the enum above and may be swapped freely.

## Residual blockers for the paid pack

1. **Derivative-attribution policy needs a Frank ruling** before the three
   MIT-derivative clears are treated as final. This record extends manifest
   rule 4 to upstream-derived *skills*, not only vendored packs.
2. **Attribution compliance is a bundle-assembly step, not done here.** For the
   three derivatives, the upstream MIT text (© 2024-2026 ruvnet) and this
   repository's own MIT notice must physically appear in the deliverable's
   licence file. Nothing was moved or copied yet, so nothing is distributed.
3. **verification-quality content drift** (functional, not licence): upstream
   now marks truth-scoring/auto-rollback as "design notes, not shipped CLI
   commands" while our copy teaches `npx claude-flow@alpha verify/rollback`
   as executable. Needs a fact pass or upstream re-sync before bundling.
4. **Cosmetic mojibake in `feynman-thinking/SKILL.md`** ("dY", garbled
   characters around the title and attribution). Cosmetic; a polish pass
   outside this lane's scope.
5. `nextjs-expert` satisfies manifest rule 1 via its `SOURCE.md`; adding an
   explicit frontmatter `license: MIT` remains optional.

## Validation

`python scripts/validate_skills.py` after all edits:

> OK: 122 skill file(s) are spec-compliant. (13 warnings, all pre-existing
> >500-line advisories, including two on skills touched here — none errors.)

## Audit provenance

- Worktree `C:\Users\frank\starlight\repos\.opencode-worktrees\skills-provenance`, branch `agent/flash/skill-provenance`, based on `origin/main` at `c6d5aeb6823652eab1006387632296c7a8f38ae7`.
- Lane `flash-5603474e`, paths `free-skills/**, docs/pack-provenance-remediation.md`, TTL 4h.
- The two concurrent lanes (`skills-eval-rc1` on evals/scripts, `skills-license` on `docs/pack-license-manifest.md`) were not touched.
