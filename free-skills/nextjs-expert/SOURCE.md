# Source and provenance

**Verdict: CLEARED-FOR-PAID-BUNDLE** — authored in-estate (origin in the FrankX
estate, synced into this repository); no third-party source recorded.

| | |
|---|---|
| Authorship | In-estate (FrankX AI Systems — Frank Riemer's estate), first recorded in-repo at `468c26e` |
| Licence | Repository MIT — see top-level `LICENSE` |
| In-repo origin | `468c26e` (2026-05-25, frankx-eth, "chore: sync skills from FrankX") — 711 lines; the body's own header records "Author: FrankX AI Systems", "Last Updated: 2026-05-13", i.e. written in the FrankX estate before the sync commit |
| Later passes | `07e270e` (2026-06-08), `e45c10e` (2026-11-02) — estate edits; 2026-11-08 de-personalisation of Frank-private config statements (see below) |
| `sha256` (SKILL.md as recorded 2026-11-08, post de-personalisation) | `23c11adb4df6f17b9a26b1993e6bfe1ff5f4f6b6a0fd2e6bf40dbd88e6cac81c` |

## Evidence

```bash
git log --follow --format="%h %ad %an %s" --date=short -- free-skills/nextjs-expert/SKILL.md
# e45c10e 2026-11-02 Frank fix(skills): make 66 skills uploadable ... (#102)
# 07e270e 2026-06-08 Frank Make the library world-class ... (#4)
# 468c26e 2026-05-25 frankx-eth chore: sync skills from FrankX - 2026-05-25
```

"FrankX" is Frank Riemer's estate brand; the sync commit transported an
estate-authored skill between repositories of the same estate. That is
in-estate authorship, not third-party derivation. No upstream third-party
source is recorded anywhere in the file or frontmatter.

## De-personalisation (2026-11-08)

The manifest flagged Frank-private platform-config statements
("FrankX currently uses `vercel.json` + `next.config.mjs`"). On this record's
commit three statements were made vendor-neutral, without touching technical
content:

- "React: 18.3 stable on FrankX" → "React: 18.3 stable in production"
- "FrankX currently uses `vercel.json` + `next.config.mjs` — migrate to
  `vercel.ts` …" → "`vercel.json` still works for simple cases. Move to
  `vercel.ts` when you need typed config, dynamic logic, or env-var access at
  config time."
- "`vercel.json` still works for simple cases (FrankX uses this — …)" →
  "`vercel.json` still works for simple cases (`framework`, `cleanUrls`,
  `ignoreCommand`, headers)."

The `**Author:** FrankX AI Systems` body line is retained deliberately: it is
the authorship record itself, not a config preference.

## Licence

Top-level `LICENSE` of this repository, lines 1 and 3, verified verbatim
2026-11-08 in the worktree at `c6d5aeb`:

> MIT License
>
> Copyright (c) 2025-2026 Frank Riemer and contributors

The operative grant (lines 5-9) permits use, copying, distribution, sublicensing
and sale. The `MIT` copyright and permission notice travels with the skill in
any bundle, paid or free.
