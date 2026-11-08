# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE** — authored in-estate; no third-party source recorded.

| | |
|---|---|
| Authorship | In-estate (Frank Riemer / contributors) |
| Licence | Repository MIT — see top-level `LICENSE` |
| In-estate origin | `5d4ee7a` (2026-08-20, Frank, "feat(free-skills): todo-discipline + free pack polish (#21)") — 56 lines added in the same estate commit that created `todo-discipline` |
| Later passes | `cd6869e` (2026-10-26, Frank, mojibake remediation), `e45c10e` (2026-11-02, Frank) |
| `sha256` (SKILL.md as recorded 2026-11-08) | `1c4f8e5575a03fb7c24e5c1f12668d1226ea45699d6b192575f18e39011389cf` |

## Evidence

Authorship established from this repository's own history (run at `c6d5aeb`,
2026-11-08):

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/feynman-thinking/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ...
# cd6869e 2026-10-26 Frank fix(skills): remediate Spine §10 corruption ...
# 5d4ee7a 2026-08-20 Frank feat(free-skills): todo-discipline + free pack polish
```

This addresses the manifest's concern that "the Feynman-technique framing
suggests possible community-prompt derivation": the file has no history outside
this repository before `5d4ee7a`, no third-party `source`/`author` marker in
frontmatter or body, and no claude-flow, ruv-swarm or community-prompt
attribution anywhere in it. The Feynman technique itself is a named public
teaching method (Psc 1xx lecture canon), not a licensable text body; no upstream
third-party source is recorded and the skill is treated as estate original work.

## Licence

Top-level `LICENSE` of this repository, lines 1 and 3, verified verbatim
2026-11-08 in the worktree at `c6d5aeb`:

> MIT License
>
> Copyright (c) 2025-2026 Frank Riemer and contributors

The operative grant (lines 5-9) permits use, copying, distribution, sublicensing
and sale. The `MIT` copyright and permission notice travels with the skill in
any bundle, paid or free.
