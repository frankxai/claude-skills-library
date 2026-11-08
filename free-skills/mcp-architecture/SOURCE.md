# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE** — authored in-estate; no third-party source recorded.

| | |
|---|---|
| Authorship | In-estate (Frank Riemer / contributors) |
| Licence | Repository MIT — see top-level `LICENSE` |
| In-estate origin | `4edecaf` (2025-10-25, Frank, "Initial release: Claude Skills Library v1.0.0") — 472 lines added |
| Later passes | `7e49dea` (2026-06-05), `07e270e` (2026-06-08), `279de9d` (2026-06-22), `d800c14` (2026-09-19), `e45c10e` (2026-11-02) — all estate commits |
| `sha256` (SKILL.md as recorded 2026-11-08) | `ac0dafa62ce2b1ab45dc462b5b5352f70717e1a0b3c9088fce0c7001eed6e07c` |

## Evidence

Authorship established from this repository's own history (run at `c6d5aeb`,
2026-11-08):

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/mcp-architecture/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ...
# d800c14 2026-09-19 Frank fix: correct stale model facts and add the agent-infrastructure pack
# 279de9d 2026-06-22 Frank Model-currency pass ...
# 07e270e 2026-06-08 Frank Make the library world-class ...
# 7e49dea 2026-06-05 copilot-swe-agent[bot] feat(skills): normalize frontmatter ...
# 4edecaf 2025-10-25 Frank Initial release: Claude Skills Library v1.0.0
```

## Licence

Top-level `LICENSE` of this repository, lines 1 and 3, verified verbatim
2026-11-08 in the worktree at `c6d5aeb`:

> MIT License
>
> Copyright (c) 2025-2026 Frank Riemer and contributors

The operative grant (lines 5-9) permits use, copying, distribution, sublicensing
and sale. The `MIT` copyright and permission notice travels with the skill in
any bundle, paid or free.

## Third-party check

No third-party source marker exists in the file or frontmatter: no
`license`/`source`/`author` field naming an external project, and no
claude-flow, ruv-swarm or community-prompt attribution anywhere in the body.
The code windows are illustrative Model Context Protocol SDK snippets, not
bundled scripts. No upstream third-party source is recorded; the skill is
treated as estate original work.
