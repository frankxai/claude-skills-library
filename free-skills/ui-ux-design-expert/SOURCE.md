# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE** — authored in-estate; no third-party source recorded.

| | |
|---|---|
| Authorship | In-estate (Frank Riemer / contributors) |
| Licence | Repository MIT — see top-level `LICENSE` |
| In-estate origin | `4edecaf` (2025-10-25, Frank, "Initial release: Claude Skills Library v1.0.0") — 717 lines added |
| Later passes | `7e49dea` (2026-06-05), `07e270e` (2026-06-08), `e45c10e` (2026-11-02) — all estate commits |
| `sha256` (SKILL.md as recorded 2026-11-08) | `c9c85cd0f22f3bb560247a4c020c0eb102f8c1e9d4873e77eec4f197038be422` |

## Evidence

Authorship established from this repository's own history (run at `c6d5aeb`,
2026-11-08):

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/ui-ux-design-expert/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ...
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
No upstream third-party source is recorded; the skill is treated as estate
original work.
