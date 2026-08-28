# Skill drift across the estate — measured 2026-08-28

The receipt behind the `agent-infrastructure` pack
([packs/agent-infrastructure/](../packs/agent-infrastructure/)). Numbers
re-derived from the working trees on the measurement date, not copied from a
prior report.

## Headline numbers

| Measure | Value |
|---|---|
| Total `SKILL.md` copies across the estate | **1065** |
| Distinct skill names | **371** |
| Names carrying more than one version | **131** |
| …of which mechanical-only drift (see below) | **108** |
| …of which real content divergence | **23** |

For contrast, the one skill already distributed through a pack —
`web-excellence`'s `web-release-gate` — sat in 15 repos with **one** md5.
The distribution mechanism works; ad-hoc copying is what drifts.

## Method

Every `SKILL.md` under any `.claude/skills/` tree in the 45-repo estate
(nested trees included — e.g. `FrankX/content-universe/.claude/skills/`),
excluding `claude-skills-library` itself. Copies are grouped by skill name
(path relative to its `skills/` root); versions are distinct md5 digests.

A second pass re-hashes each copy after two normalizations and reclassifies:

- **CRLF line endings** stripped — `arcanea`'s copies are CRLF clones of the
  consensus, byte-identical after conversion.
- **One injected `version: "x.y.z"` frontmatter line** removed —
  `arcanea-ai-app`'s copies are the consensus plus a stamped version line.

A name whose versions collapse to one after normalization is **mechanical**
drift: same instructions, noisy bytes, fixed by any single re-copy. A name
that still has multiple versions is **real** divergence: an agent gets
different instructions depending on the repo. 108 of the 131
drifted names are mechanical; 23 are real. The two mutation sources are
worth knowing: whatever wrote CRLF into `arcanea` and whatever stamped version
lines into `arcanea-ai-app` will keep manufacturing fake drift until retired.

## What the agent-infrastructure pack resolves

8 of the 131 drifted names now have one canonical version in
`free-skills/` and an installer that fans it out: `swarm-orchestration`
(the worst offender, 4 raw versions), `swarm-advanced`,
`reasoningbank-intelligence`, `reasoningbank-agentdb`, `hooks-automation`,
`stream-chain`, `verification-quality`, `skill-builder`. The pack also carries
`hive-mind-advanced` (estate-uniform today, same monolith-vs-split exposure).
Per-skill reconciliation decisions:
[packs/agent-infrastructure/SOURCES.md](../packs/agent-infrastructure/SOURCES.md).

One divergence was deliberately **not** flattened: the FrankX/
frankx.ai-vercel-website `swarm-orchestration` fork, documented and flagged
there for a local rename.

## What remains (123 names), and the cheap path through it

- **`ui-ux-pro-max`** (2 versions, 16 copies — the widest): already resolved
  by the shipping `web-excellence` pack; the estate copies predate it.
  Re-running that pack's installer is the fix, no new work.
- **`opus-extended-thinking`**: corrected v2.1.0 lives in `free-skills/`
  (2026-08-28 model-facts commit); estate copies still teach the removed
  `budget_tokens` API. Distributes via catalog/plugin channel.
- **The Anthropic document/media set** (`xlsx`, `pptx`, `pdf`, `docx`,
  `doc-coauthoring`, `canvas-design`, `algorithmic-art`, `slack-gif-creator`,
  `theme-factory`, `webapp-testing`, `web-artifacts-builder`…): all
  mechanical-only. Four of five doc skills are byte-identical to
  `free-skills/anthropic/` already, aux files included. A `document-tools`
  pack is pure fan-out — no reconciliation needed.
- **The `arcanea`/`arcanea-ai-app` mirrored namespaces** (`oss/*`,
  `creative/*`, `development/*`, `academy/*`, `arcanea/*`, `premium/*` — 75
  names): almost entirely mechanical (CRLF/version-stamp) between exactly
  those two repos. That is a two-repo sync question for the Arcanea pair, not
  library material; the handful with real variants are in the table below.
- **The remaining real divergences** (`suno-*`, `nextjs-*`, `strategic-compact`,
  `library-os`, `coding-guardrails`, `design-thinking`, `visual-creation`,
  `frankx-brand` cluster…): each needs the same per-skill adjudication this
  pack demonstrated. Candidate groupings by usage: a creator/content pack and
  a nextjs tooling set. Note `coding-guardrails` is generated per-repo by
  `agentic-ops-hub`'s sync script — its two versions may both be correct
  outputs, not drift; check the generator before canonizing.

## Full table — all 131 drifted names

Copies counted across estate working trees on 2026-08-28. "mechanical" =
versions collapse to one after CRLF + version-line normalization.

| Skill | Raw versions | Copies | Class | Repos | Resolution |
|---|---|---|---|---|---|
| `swarm-orchestration` | 4 | 5 | real (2v) | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `algorithmic-art` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `canvas-design` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `doc-coauthoring` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `docx` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `hooks-automation` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `pdf` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `pptx` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `reasoningbank-agentdb` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `reasoningbank-intelligence` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `skill-builder` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `slack-gif-creator` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `web-artifacts-builder` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `xlsx` | 3 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `suno-prompt-architect` | 3 | 3 | real (2v) | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `ui-ux-pro-max` | 2 | 16 | real (2v) | FrankX, GenCreator-Studio, agentic-creator-os, agentic-income-template, agenticincome, agenticpassiveincome, ai-music-academy, arcanea, arcanea-ai-app, blue-life-commons, frankx-palace, frankx.ai-vercel-website, gencreator-community, gencreator.ai, realityarchitect, starlight-swarm | web-excellence pack (already shipping) |
| `excellence-book-writing` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `github-code-review` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `github-multi-repo` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `github-project-management` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `github-release-management` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `github-workflow-automation` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `opus-extended-thinking` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | corrected in free-skills 2026-08-28 |
| `stream-chain` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `swarm-advanced` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `theme-factory` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `verification-quality` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website | agent-infrastructure pack |
| `webapp-testing` | 2 | 5 | mechanical | FrankX, agentic-creator-os, arcanea, arcanea-ai-app, frankx.ai-vercel-website |  |
| `library-os` | 2 | 4 | real (2v) | FrankX, agentic-creator-os, arcanea-ai-app, frankx.ai-vercel-website |  |
| `frankx-brand` | 2 | 3 | mechanical | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `nextjs-agent-team` | 2 | 3 | real (2v) | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `nextjs-expert` | 2 | 3 | real (2v) | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `nextjs-upgrade-assistant` | 2 | 3 | real (2v) | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `strategic-compact` | 2 | 3 | real (2v) | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `suno-ai-mastery` | 2 | 3 | real (2v) | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `template-monetization` | 2 | 3 | mechanical | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `web-design-expert` | 2 | 3 | mechanical | FrankX, agentic-creator-os, frankx.ai-vercel-website |  |
| `academy` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `academy/gate-01-foundation` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `academy/gate-02-flow` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `academy/gate-03-fire` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `agentdb-advanced` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `agentdb-learning` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `agentdb-memory-patterns` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `agentdb-optimization` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `agentdb-vector-search` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea-core/luminor-personality-design` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `arcanea/arcanea-canon` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea/arcanea-creator-academy` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea/arcanea-design-system` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `arcanea/arcanea-lore` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea/arcanea-voice` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea/centaur-mode` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea/design-system` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `arcanea/luminor-rituals` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea/luminor-wisdom` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `arcanea/premium-visual` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `arcanea/prompt-craft` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `blog-master` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `coding-guardrails` | 2 | 2 | real (2v) | FrankX, agentic-ops-hub |  |
| `community/agent-orchestration` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `community/creative-writing` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `community/design-systems` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `community/development-workflows` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `community/documentation-patterns` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `community/testing-strategies` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `content-repurposer` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `content-universe-oracle` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `course-architect` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `creative/bestiary-nav` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `creative/character-forge` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `creative/dialogue-mastery` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `creative/revision-ritual` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `creative/scene-craft` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `creative/story-weave` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `creative/voice-alchemy` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `creative/world-build` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `design-thinking` | 2 | 2 | real (2v) | FrankX, frankx.ai-vercel-website |  |
| `development/api-design` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `development/architecture-patterns` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `development/code-review` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `development/next-best-practices` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `development/performance-tuning` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `development/react-best-practices` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `development/refactoring-ritual` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `development/systematic-debug` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `development/tdd` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `development/typescript-expert` | 2 | 2 | real (2v) | arcanea, arcanea-ai-app |  |
| `external/doc-coauthoring` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `external/docx` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `external/mcp-builder` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `external/pdf` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `external/pptx` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `external/xlsx` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `impact-engineer` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `industry/game-development` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `industry/startup-building` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `industry/technical-writing` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `literary-architect` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `meta/creative-flow` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `meta/deep-work` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `meta/skill-mastery` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/api-design` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/architecture-patterns` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/bestiary-nav` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/character-forge` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/code-review` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/creative-flow` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/deep-work` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/dialogue-mastery` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/performance-tuning` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/refactoring-ritual` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/revision-ritual` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/scene-craft` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/skill-mastery` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/story-weave` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/systematic-debug` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/tdd` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/voice-alchemy` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `oss/world-build` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `premium/enterprise-orchestration` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `premium/industry-verticals` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `premium/teacher-mentor` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `premium/teacher-team` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `premium/visionary-council` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `premium/visionary-team` | 2 | 2 | mechanical | arcanea, arcanea-ai-app |  |
| `publishing-pipeline` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `social-media-strategist` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `truth-weaver` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
| `visual-creation` | 2 | 2 | real (2v) | FrankX, frankx.ai-vercel-website |  |
| `voice-alchemist` | 2 | 2 | mechanical | FrankX, frankx.ai-vercel-website |  |
