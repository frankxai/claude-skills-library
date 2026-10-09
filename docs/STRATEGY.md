# Strategy: the reference skills library

**Status:** active · **Date:** 2026-10-09 · **Owner:** `agent:starlight-caio` · **Decides:** Frank

This page states where the library stands, what the leaders do that we do not, what we do that
they do not, and the four bets that close the gap. Numbers carry a date. Anything without one is a
judgment, labelled as such.

---

## Where we stand (as of 2026-10-09)

| Measure | Value | Source |
|---|---|---|
| Skills | 114 | `python3 scripts/check_counts.py` |
| Packs | 6 | `ls packs/` |
| Estate repos carrying at least one pack | 19 | scan of `*/.claude/skills` across the checked-out estate |
| Distinct skill names across the estate | 231, of which 157 are not in this library | same scan |
| Skills with evals | 0 | `catalog/skills.json` → `totals.skillsWithEvals` |
| GitHub stars | 46 | repository metadata |
| Open draft PRs | 10 | repository metadata |
| GitHub license classification | "Other" until the LICENSE trailer was removed in this change | repository metadata |

The library is small in audience and large in rigor. That is the correct order to be in. Rigor is
hard to add to a popular repo. Audience is a distribution problem, and distribution is a list of
tasks.

---

## The landscape

The skills category consolidated around a few repositories in 2026. Named here without star counts;
the counts move weekly and third-party roundups disagree with each other. Check the repo page.

| Repository | What it is | What it teaches us |
|---|---|---|
| `obra/superpowers` | A methodology framework: brainstorming, planning, TDD, systematic debugging, subagent-driven development. | A **named process** people can adopt wholesale beats a catalog of parts. Our packs are the equivalent unit; we should say so louder. |
| `anthropics/skills` | The official reference skills: documents, design, MCP builder, skill creator. | Being the **upstream** of a format is the strongest position. We already vendor these under `free-skills/anthropic/`; we should track them with the same pin-and-drift discipline as `web-excellence`. |
| `mattpocock/skills` | Engineering skills for domain modelling, architecture, diagnosis, review. | Narrow, opinionated, from a known teacher. **Author identity** is a distribution channel. |
| `addyosmani/agent-skills` | Production engineering skills. | Same lesson. The author's name is the brand. |
| `vercel-labs/agent-skills` and `vercel-labs/skills` | Framework-owner skills plus the `find-skills` entry point and the `skills.sh` directory. | **Be where installs happen.** `skills.sh` ranks by installs, not stars. Every lane must be installable with one `npx skills add` line, and the README must lead with it. |
| `emilkowalski/skills` | Motion and design craft. | Already vendored and pinned in `web-excellence`. The model for how we absorb: verbatim copy, pinned commit, license beside it, re-sync script. |
| `garrytan/gstack` | An engineering sprint system with real browser QA and ship/deploy loops. | Already composed in ACOS. **Depend**, do not absorb: it is a runtime, not a pattern. |
| `multica-ai/andrej-karpathy-skills` | One file of behavioural guidelines. | A single sharp file can outrank a thousand skills. Our Band A guardrails are that file; publish them as a skill. |
| `VoltAgent/awesome-agent-skills`, `hesreallyhim/awesome-claude-code`, `BehiSecc/awesome-claude-skills` | Curated lists. | **Be listed.** One PR to each with the install line is cheap and permanent. |

What none of them ship: enforcement hooks with tests, pinned provenance with drift checks,
self-checking counts, an inbound contract, or a primitive that fails a scheduled run when nothing
durable was written. Those are ours. Evals are nobody's yet.

---

## The four bets

### 1. Evals before volume

A skill without an eval is a claim. The first library to publish, per skill, the trigger cases it
passes, the outcome cases it passes, and the cases it fails, becomes the one people cite.

- Ship the harness open-source: trigger evals (does the description fire on the right ask and stay
  quiet on the wrong one) and outcome evals (does the agent's output clear a rubric).
- Start with the nine skills in `agent-infrastructure` plus `web-release-gate`, `estate-guard`,
  `mcp-architecture`, `github-code-review`, `nextjs-expert`.
- `catalog/skills.json` already carries `hasEvals` per skill and `skillsWithEvals` in totals. The
  README badge for it appears the day the number is non-zero.
- Open PRs #33, #34, #35, #46 hold prior eval work. Land or close them; do not start a fifth branch.

### 2. Packs are the product

A pack is what a directory cannot sell: the sequence, the hook that blocks, the test that proves the
hook, the provenance table. Six exist and nineteen repos run them.

- Give every pack a one-line install, a `--dry-run`, and a `--check` for drift. Two of six have all three.
- Installers keep one set-aside copy under `.claude/skills/.replaced/`; a second run overwrites it. Make the set-aside versioned before calling re-runs safe.
- Publish each pack as its own entry in `.claude-plugin/marketplace.json` so `/plugin install` works per pack, not only for the whole library.
- Candidate seventh pack: `agent-hygiene`, the Band A guardrails and Karpathy-distilled rules as one installable skill plus a `Stop` hook that asks for the verification line. It is the single-file lesson from the landscape table.

### 3. Absorb patterns, not prose

The best skills from other libraries enter through `ABSORPTION.md`'s four gates, or are depended on,
never pasted. Verdicts on the current candidates:

| Candidate | Verdict | Why |
|---|---|---|
| `anthropics/skills` reference set (`skill-creator`, `frontend-design`, `doc-coauthoring`, `web-artifacts-builder`) | **Vendor with pins**, like `web-excellence` does | Already copied by hand into 3 to 5 estate repos; that is the drift pattern this library exists to end. Move them under `free-skills/anthropic/` with a `SOURCES.md` pin table and `sync-upstream.sh`. |
| `obra/superpowers`: brainstorming, writing-plans, test-driven-development, systematic-debugging | **Absorb the patterns** | The value is the sequence and the refusal rules. Re-express in our format with credit; the prose is theirs and their vocabulary does not compose with ours. |
| `mattpocock/skills`, `addyosmani/agent-skills` | **Absorb selectively** | Take the diagnosis and review checklists where ours are thinner. Run gate 3 (distinctness) hard; several overlap `github-code-review` and `ai-architect-review`. |
| `vercel-labs/agent-skills`: `react-best-practices`, `next-best-practices` | **Vendor with pins** into `web-excellence` | Framework owner, MIT, moves fast. Same treatment as `web-design-guidelines`. |
| `garrytan/gstack` | **Depend** | It is a runtime with a browser. ACOS already composes it. A skill card for a system we run is an adapter, which is allowed; a copy of it is not. |
| `multica-ai/andrej-karpathy-skills` | **Do not absorb; publish our own** | Band A already says this in our voice. Ship it as `agent-hygiene`. |

### 4. One canonical copy

The estate scan found 157 skill names present in sibling repos and absent here. The ones in three or
more repos are the mirror queue, in order:

| Skill | Repos | Note |
|---|---:|---|
| `security-auditor`, `search-first`, `verification-loop`, `planning-with-files`, `safety-guard`, `memory-guardian`, `rules-distill`, `strategic-compact`, `santa-method`, `skill-stocktake` | 3 | Estate-native. Validate frontmatter, mirror, then install back from here. |
| `prompt-optimizer`, `product-engine`, `hook`, `frankx-brand`, `library-os`, `vis`, `xpoz-intelligence`, `template-monetization` | 3 to 4 | Estate-native, brand-adjacent. Mirror the generic ones; keep brand-locked ones in ACOS. |
| `skill-creator`, `frontend-design`, `doc-coauthoring`, `web-artifacts-builder`, `github-workflow-automation` | 3 to 5 | Anthropic or upstream. See bet 3: vendor with pins. |

Adapters to systems we run stay in ACOS; they are not catalog material.

Rule: a skill lives in exactly one place. Repos install it; they do not fork it. The
`agent-infrastructure` pack's content-hash drift check is the template.

---

## Distribution: the list of tasks

Ordered by leverage per hour.

1. **GitHub repository settings.** Description: "114 Agent Skills and 6 enforcement packs for Claude Code and every skills-aware runtime. Pinned provenance, hooks with tests, self-checking counts." Homepage: the catalog site. Topics to add: `agent-skills`, `skills-sh`, `cursor`, `codex`, `gemini-cli`, `opencode`, `claude-plugins`. Enable GitHub Pages from `docs/` or connect the repo to Vercel; `vercel.json` is committed.
2. **Social preview image.** Upload `assets/logo-wordmark.svg` rendered at 1280 x 640 as the repository social preview. The hero PNG in `assets/` is 893 KB and unreferenced; replace it with the rendered wordmark.
3. **Be listed.** One PR each to `VoltAgent/awesome-agent-skills`, `hesreallyhim/awesome-claude-code`, `BehiSecc/awesome-claude-skills` with the `npx skills add` line and the packs sentence.
4. **skills.sh.** Confirm all three lanes resolve: `frankxai/claude-skills-library`, `frankxai/skills`, `frankxai/creator-skills`. Installs are the ranking signal there. Known gap: the CLI walks manifest-declared directories one level deep, so the skills nested under `anthropic/`, `creative/` and `technical/` are not installed by the bare command. Decide between flattening the three namespaces and declaring explicit per-skill entries in `marketplace.json`; either way the Claude Code plugin path must keep finding all 114.
5. **Release cadence.** Tag a release when the count or a pack changes. A `CHANGELOG.md` and GitHub Releases give the README a "what's new" that search engines and aggregators pick up.
6. **Close the PR queue.** Ten open drafts read as abandonment. Land #48 (already absorbed into this README), reconcile #43 with this README, then land or close the eval PRs under bet 1.
7. **Author identity.** The landscape shows the author's name is the channel. The frankx.ai pages for skills and the newsletter should link here with the install line, and each new pack ships with one post.

---

## Logos and marks

- `assets/logo.svg`: the mark. Three stacked skill cards on a dark rounded square, emerald to cyan. Works at 16 px and 512 px.
- `assets/logo-wordmark.svg`: mark plus wordmark and the one-line claim, for the social preview and the catalog site header.
- `.github/assets/hero.svg`: the animated README banner, unchanged.

Palette is the one the hero already uses: `#10b981` to `#06b6d4` on `#0a0a0b`. It is the Starlight
substrate register, canon-free, per `starlight-design-intelligence/brand-packs/sis/COPY.md`.

---

## What "number one" means here

Not the most stars. The most-cited library when someone asks "which skills can I trust in a repo
that ships". That is won by evals nobody else publishes, packs nobody else enforces, and provenance
nobody else pins. Stars follow citations. Installs follow the one-line install at the top of the
README.

Review this page when a bet lands or when the measures table is more than a quarter old.
