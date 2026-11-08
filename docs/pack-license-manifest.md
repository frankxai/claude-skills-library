# Pack license manifest — candidate paid skill pack

Author: agent lane `flash` (`agent/flash/pack-license-manifest`) · 2026-11-08 · audited at `origin/main` `c6d5aeb` (HEAD at audit).

Purpose: record the licence and provenance state of the ten candidate skills for a paid bundle, and the assets that are excluded. Release blocker: nothing with restrictive or unrecorded rights ships for sale. All quotes below are verbatim from files at commit `c6d5aeb` in this repository; nothing is interpreted beyond what the text says.

## Repo-level licence

Top-level `LICENSE`, line 1 and line 3:

> MIT License
>
> Copyright (c) 2025-2026 Frank Riemer and contributors

Operative grant (lines 5–9): *"Permission is hereby granted, free of charge, to any person obtaining a copy of this software … to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so."* This MIT grant covers content authored in this repository; it does not cover third-party material bundled into skills, which must stand on its own licence.

## Ten candidate skills (`free-skills/`)

For each: provenance file present (LICENSE / LICENSE.txt / UPSTREAM-LICENSE / SOURCE.md), content of the operative line quoted where one exists, executable scripts or hooks shipped with the skill, and verdict.

| Skill | Provenance file | Operative line (verbatim) | Scripts/hooks shipped | Verdict |
|---|---|---|---|---|
| mcp-architecture | none | — (no LICENSE, no SOURCE.md, no author/source in frontmatter) | No (`SKILL.md` only; code windows are illustrative SDK snippets, not bundled scripts) | **NEEDS-REVIEW** — no licence or authorship record; cannot confirm third-party content is not embedded |
| model-routing | none | — (frontmatter `metadata: source: "claude-flow"`, `routing-rules.json` `_source: "claude-flow Q-Learning Router pattern + model-registry.json"; no licence file) | No (`SKILL.md` + `routing-rules.json`, data only) | **NEEDS-REVIEW** — derived from the claude-flow ecosystem per its own source line; the upstream licence is not recorded here |
| github-code-review | none | — (frontmatter `author: "Claude Code Flow"`, `requires: "github-cli, ruv-swarm, claude-flow"`) | No (`SKILL.md`, `references/reference.md`; Bash examples are instructive prose) | **NEEDS-REVIEW** — attributed to "Claude Code Flow" with ruv-swarm/claude-flow dependencies; no licence verifies rights to redistribute it commercially |
| verification-quality | none | — (no licence/author/source in frontmatter; body instructs `npx claude-flow@alpha verify …`) | No (`SKILL.md`, `references/guide.md`) | **NEEDS-REVIEW** — no provenance record; body couples it to third-party claude-flow tooling |
| todo-discipline | frontmatter `license: MIT` (no separate file) | `license: MIT` · `author: "Frank Riemer / GenCreator"` | No (`SKILL.md` only) | **CLEARED-FOR-PAID-BUNDLE** — explicit MIT licence, in-estate authorship, prose-only; carry the licence/author notice into the bundle |
| ai-architect-review | `SOURCE.md` + frontmatter `license: MIT` | `license: MIT` · SOURCE.md: "`SKILL.md` in this directory is a **byte-identical mirror** … Canonical file: `public/skills/ai-architect-review/SKILL.md` [in frankxai/frankx.ai-vercel-website] … Pinned commit `344510ea167be7b98acfff4b9e712de86cf6fcd6` … License \| MIT" | No (`SKILL.md` + `SOURCE.md`) | **CLEARED-FOR-PAID-BUNDLE** — MIT, provenance pinned by commit and sha256; ship the `SOURCE.md` alongside |
| ui-ux-design-expert | none | — (no licence, author or source record) | No (`SKILL.md` only) | **NEEDS-REVIEW** — no licence or authorship record |
| nextjs-expert | none | — (no licence file; frontmatter has no `license` field; body: "**Author:** FrankX AI Systems") | No (`SKILL.md` only) | **NEEDS-REVIEW** — authorship line is present but no explicit per-skill licence field; also carries personal config preferences ("FrankX currently uses `vercel.json` + `next.config.mjs`") that a paid pack should strip before bundling |
| product-management-expert | none | — (no licence, author or source record) | No (`SKILL.md` only) | **NEEDS-REVIEW** — no licence or authorship record |
| feynman-thinking | none | — (no licence, author or source record) | No (`SKILL.md` only) | **NEEDS-REVIEW** — no licence or authorship record; the Feynman-technique framing suggests possible community-prompt derivation that nothing here can verify |

**Tally: 4 CLEARED-FOR-PAID-BUNDLE · 6 NEEDS-REVIEW · 0 clearable without a written record.** No licence in this set is ambiguous per se; every NEEDS-REVIEW is missing evidence, not contradictory evidence, so the credit is fixable by adding `SOURCE.md`-style records (canonical file, upstream repo, pinned commit, licence) as `ai-architect-review/SOURCE.md` already does. Next.js Expert additionally needs de-personalisation even after a licence record lands.

## Excluded from the paid bundle

### `free-skills/anthropic/**` — HARD NO (service-terms licence, 4 skills; whole subtree excluded)

13 skills total under `free-skills/anthropic/`: algorithmic-art, artifacts-builder, brand-guidelines, canvas-design, docx, internal-comms, mcp-builder, pdf, pptx, slack-gif-creator, theme-factory, webapp-testing, xlsx — each with a `LICENSE.txt`.

- **9 skills** (algorithmic-art, artifacts-builder, brand-guidelines, canvas-design, internal-comms, mcp-builder, slack-gif-creator, theme-factory, webapp-testing) ship the standard **Apache License, Version 2.0, January 2004** text — free redistribution permitted by Apache-2.0 §4 conditions, though Apache-2.0 content still requires the licence text and notices to travel with it, and Anthropic trademark use is not granted by it.
- **4 skills** (docx, pdf, pptx, xlsx) ship an **"All rights reserved"** licence confirmed, verbatim, first line: *"© 2025 Anthropic, PBC. All rights reserved."* The operative lines govern everything the estate does with them:

  > "LICENSE: Use of these materials (including all code, prompts, assets, files, and other components of this Skill) is governed by your agreement with Anthropic regarding use of Anthropic's services."
  >
  > "ADDITIONAL RESTRICTIONS: … users may not: Extract these materials from the Services or retain copies of these materials outside the Services … Reproduce or copy these materials, except for temporary copies created automatically during authorized use of the Services … Create derivative works based on these materials … Distribute, sublicense, or transfer these materials to any third party."
  >
  > "Anthropic retains all right, title, and interest in these materials, including all copyrights, patents, and other intellectual property rights."

  That is an outright prohibition on redistribution in any bundle, paid or free. These four must be pulled from every distribution surface this estate operates — a bundled copy would itself be an unlicensed extraction-and-redistribution, independent of what is charged.

**Decision: the entire `free-skills/anthropic/**` subtree is excluded from paid packs** — the 4 restricted skills are prohibited by their licence text, and free-skills/anthropic is Anthropic's skill set, not the estate's distinguishable work.

### `free-skills/partner-*` — excluded (5 skills: partner-anthropic, partner-arrow, partner-google, partner-nvidia, partner-vercel)

These are frankx relationship-briefing skills, not redistributable catalogue content. Quotation — free-skills/partner-anthropic/SKILL.md frontmatter/description and body: *"Anthropic intelligence … partnership-conversation prep for Anthropic, or evaluating new Anthropic releases"* and *"Frank's relationship state, integration patterns"*. Similar personal/business-intelligence framing throughout the set. No licences present. Excluded as Frank-personal and proprietary irrespective of rights.

### `packs/film-excellence` — excluded (no licence, executable installer, canon flavor)

Contains no `LICENSE`, `LICENSE.txt` or `UPSTREAM-LICENSE` file at all (only README/CREW/DOCTRINE/LANGUAGE/PIPELINE docs, `film-design.md`, `film-taste.md`, one skill, templates and an `install.sh`). Files like `film-taste.md` and `DOCTRINE.md` are estate taste canon. With no rights document, nothing here can be cleared; also bundles an executable `install.sh`. Excluded: unlicensed provenance and personal-canon content. To ever ship it, first write appraisable licence records and strip the canon layer.

### `packs/web-excellence` — excluded from *this candidate pack's default shippable set* by decision; upstream rights are permissive (11 skills, all with UPSTREAM-LICENSE records)

Each vendored skill carries a `UPSTREAM-LICENSE` written by `sync-upstream.sh`. The licence names, verbatim first lines:

- **MIT — Emil Kowalski (6 skills):** animation-vocabulary, apple-design, emil-design-eng, find-animation-opportunities, improve-animations, review-animations — *"MIT License Copyright (c) 2026 Emil Kowalski"*.
- **MIT — Leonxlnx (2 skills):** brandkit, image-to-code — *"MIT License Copyright (c) 2026 Leonxlnx"*.
- **MIT — Arvind (1 skill):** extract-design-system — *"MIT License Copyright (c) 2026 Arvind"*.
- **MIT — Next Level Builder (1 skill):** ui-ux-pro-max — *"MIT License Copyright (c) 2024 Next Level Builder"*.
- **MIT via README declaration (1 skill):** web-design-guidelines — its `UPSTREAM-LICENSE` records that vercel-labs/agent-skills at pinned commit `7c180d9044c9` "ships no LICENSE file at this commit" and its README declares "MIT".

Each of the ten signed-off MIT files grants, verbatim: *"Permission is hereby granted, free of charge, to any person obtaining a copy of this software … to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so"*, subject to retaining the *"above copyright notice and … permission notice … in all copies or substantial portions of the Software."*

**Finding:** redistribution of these ten signed-off upstream skills inside a paid bundle is permitted by the licence files themselves. It stays out of this candidate pack by decision, not law: the pack is a curated frankx-work set, and the vendored web-excellence pack is a derived bundle with its own sync-lifecycle (`sync-upstream.sh`, `tests/test_sync_upstream.py`). If it ever becomes shippable, every MIT notice must travel verbatim with each skill. The `web-design-guidelines` skill is the **NEEDS-REVIEW** edge in this pack: its licence rests on a README declaration recorded by a script rather than a file in the upstream repo at the pinned commit.

### Frank-personal / Arcanea canon — excluded (no licences, non-public content by nature)

Observed concretely at `free-skills/`:

- **Arcanea canon:** `arcanea-book-cover` ("Arcanea Book Cover Design Skill"), `arcanea-infogenius` (Arcanea Gates colour/composition framework), `arcanea-meta` ("Arcanea ecosystem self-description … system map, where things live, canonical locations").
- **FrankX personal/reflective:** `starlight-chronicle` ("reflective layer of the FrankX OS … Palace Review, … Legacy Audit"), `frankx-daily-execution` ("Executes Frank's daily workflow … planning Frank's day"), `si` (FrankX OS lanes — "BUILD lane … frankx-website-builder"), `book-publishing` ("FrankX's 6-book publishing platform … produce content indistinguishable from Frank's authored work"), `soulbook` (`7-pillars/CLAUDE.md` + `skill.yaml`, personal canon), `spartan-warrior` ("The Spartan Building FrankX").

None carries a licence file. Excluded by both standards: no rights record, and the content is internal estate material never intended for sale.

## Bundling rules

Derived only from what this audit found at `c6d5aeb`.

1. **Written record or it does not ship.** A skill enters the paid pack only when a `license:` frontmatter field, a `LICENSE`/`LICENSE.txt`, an `UPSTREAM-LICENSE`, or a `SOURCE.md` states the rights at the pinned provenance. Six of ten candidates currently fail this rule.
2. **Repo MIT is not a substitute for a per-skill record.** The top-level MIT `LICENSE` (© 2025-2026 Frank Riemer and contributors) covers estate-authored content, but where the file was mirrored or adapted from elsewhere, a `SOURCE.md` with upstream repo, pinned commit, sha256 and licence is the required evidence.
3. **"All rights reserved" and service-terms material is forbidden, not flagged.** Anything whose licence carries the Anthropic docx/pdf/pptx/xlsx pattern (extraction ban + derivative-works ban + no-third-party-distribution) never enters a bundle at any price; review is not the remedy, removal is.
4. **MIT upstream may be vendored into a paid bundle** — where the UPSTREAM-LICENSE text grants distribute/sell, as all ten `packs/web-excellence` records do — provided the copyright owner and permission notice travel verbatim with the skill in the deliverable.
5. **Apache-2.0 upstream may ship likewise**, with the full licence text of the delivered copy and its notices retained; trademarks are not granted by it. Currently moot: `free-skills/anthropic/**` is excluded as a whole by rule 3.
6. **Partner-intelligence, personal-OS and Arcanea canon skills are excluded by content class** (partner-*, starlight-chronicle, frankx-daily-execution, si, book-publishing, soulbook, arcanea-*, spartan-warrior): they contain non-public personal or business material no licence can clear for resale.
7. **Executable surfaces are declared.** At audit, all ten candidates shipped prose-only (no bundled scripts/hooks); anything that does bundle scripts (like `packs/film-excellence` `install.sh`) must have them listed in the manifest and reviewed before bundling.
8. **Fix NEEDS-REVIEW by adding evidence, not by reading intent.** The path of record is `SOURCE.md`-style files (canonical file, upstream repo, pinned commit, sha256, licence) as `free-skills/ai-architect-review/SOURCE.md` demonstrates. Where the record cannot be produced — origin unknown, upstream untraceable, licence resting on a README declaration alone — the skill stays out of the pack.

## Audit provenance

- Audited at origin/main `c6d5aeb` (worktree `agent/flash/pack-license-manifest`); all quotes verbatim from files at that revision.
- Lane ID `flash-a54c7a54`, paths `docs/pack-license-manifest.md`, TTL 4h.
