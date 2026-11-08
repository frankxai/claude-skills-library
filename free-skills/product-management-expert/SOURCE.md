# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE** — authored in-estate; no third-party source recorded.

| | |
|---|---|
| Authorship | In-estate (Frank Riemer / contributors) |
| Licence | Repository MIT — see top-level `LICENSE` |
| In-estate evidence | Stub created `a2fdac9` (2025-10-31, Frank, "feat: add 15 new premium skills") with **0 lines**; real content authored in-estate at `7e49dea` (2026-06-05, copilot-swe-agent[bot], 66 lines) |
| Later passes | `e45c10e` (2026-11-02 Frank, claude.ai/API upload fixes) |
| `sha256` (SKILL.md as recorded 2026-11-08) | `b37ed43ac961c009d1e22c779815adc33d65682e41030e7d29f9975f4648fc4c` |

## Evidence

Authorship established from this repository's own history (run at `c6d5aeb`,
2026-11-08). Note the file was an empty stub at creation (`git show a2fdac9
--stat` shows `0 ++`); the entire current text was written inside this
repository by a repository contributor (GitHub Copilot's swe-agent working
under the estate's own commit 2026-06-05, "normalize frontmatter, fill stub
skills, add validator"):

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/product-management-expert/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ...
# 7e49dea 2026-06-05 copilot-swe-agent[bot] feat(skills): normalize frontmatter, fill stub skills, add validator
# a2fdac9 2025-10-31 Frank feat: add 15 new premium skills to free library (stub, 0 lines)
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
