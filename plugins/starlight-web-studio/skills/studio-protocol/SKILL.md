---
name: studio-protocol
description: The operating contract for the Starlight web studio team. Use when running /studio or /studio-sweep, when deciding which studio agents to dispatch for a website or interface task, or when a site needs to go from audit to proposal to shipped page. Defines the five routes through the graph, which roles are active in each phase, what every role must hand over, the write lanes, and the gates no role can skip.
---

# Studio protocol

The studio is a graph, not a pipeline. The main session is the **director**: it
reads the target, picks a route, dispatches at most five roles per phase, decides
between directions, and owns the final call on taste. Subagents cannot spawn
subagents, so the director never delegates its own job.

## The roster

| Role | Agent | Writes | Judges |
|---|---|---|---|
| Scout | `site-scout` | `.studio/` evidence only | nothing; it measures |
| Strategist | `audience-strategist` | brief | who the page is for, what it must beat |
| Art director | `art-director` | directions, scene brief | composition, type, material |
| Copy chief | `copy-chief` | copy files, content | every word a visitor reads |
| Search strategist | `search-strategist` | head metadata, JSON-LD, robots, sitemap, llms.txt | findability by search and answer engines |
| Motion director | `motion-director` | motion components, motion score | what moves, why, and the reduced-motion path |
| GPU artist | `gpu-artist` | one GPU surface per page | whether a page earns WebGL at all |
| Media producer | `media-producer` | prompt packets, assets, provenance sidecars | generated image and video |
| Builder | `site-builder` | layout, components, styles | static composition |
| Critic | `studio-critic` | nothing; returns its report | the work, as a buyer who declined to pay |
| Verifier | `release-verifier` | nothing; returns its report | whether "done" is true |

Maker and checker never overlap. The critic and the verifier hold no write
tools, and the critic must route its pass through a different model provider
(see `studio-critic`). A same-provider critique is recorded as missing.

## Pick the route

Read the target first: the repo's `design.md`, `taste.md`, `AGENTS.md`/`CLAUDE.md`,
the brand pack it names, and the latest `.studio/` evidence. Then choose:

| Route | When | Phases and active roles |
|---|---|---|
| **R1 sweep** | proactive, no specific ask | sweep (`studio-sweep.mjs`) → scout on the top 3 → director ranks → proposals |
| **R2 hygiene** | machine findings only: metadata, JSON-LD, alt, viewport, manifest | scout → search strategist or builder → verifier |
| **R3 words** | the page works but says too little or too much | scout → strategist → copy chief → critic → verifier |
| **R4 page** | a page or section needs a new composition | strategist → art director (2 directions) → **decide** → copy chief + builder → critic → verifier |
| **R5 flagship** | a first screen that must stop people: cinematic, motion-led | strategist → art director (3 directions) → **decide** → copy chief + builder (static first) → motion director → GPU artist and/or media producer → critic → verifier |

Escalate a route when the evidence demands it; never de-escalate silently. If
R3 finds the composition is the problem, say so and move to R4.

## Phase contracts

Every role leaves a file under `.studio/<target-id>/` (the critic and verifier return theirs and the director saves it) plus a short summary. The
next role reads the file, not the summary.

1. **Capture** (`site-scout`): `scan.json` from `studio-scan.mjs`, screenshots at
   375, 768 and 1440 in each theme the site ships (the `visual-proof` skill), and
   `audit.md` scored with the `studio-audit` rubric. No capture, no visual claim.
2. **Brief** (`audience-strategist`): `brief.md` naming the buyer, the job they
   came to do, what they use today, and **three named, current references** this
   must beat, each on one stated dimension. Opened this session, not remembered.
3. **Directions** (`art-director`): `directions.md` with 2 or 3 directions that
   differ on at least two of composition, typography, material, interaction,
   motion. Palette alone does not count. Each has a static mock or a precise
   scene brief.
4. **Decide** (director): pick one, write `decision.md` with the rejected
   directions and why. One named taste owner decides; councils advise.
5. **Build**: static composition first. Type and spacing carry the page before
   anything moves. Then motion, then GPU, then generated media, each only with a
   stated job.
6. **Refine**: a separate pass whose only output is cut words, tightened
   spacing, fixed hierarchy, removed sections. Record its diff stat.
7. **Critique** (`studio-critic`): different provider, skeptical buyer. Fix what
   it finds or decline in writing.
8. **Verify** (`release-verifier`): recapture, rescan, compare to step 1. Returns
   ship, revise, or block with evidence paths.

## Write lanes

Two roles never edit the same file in one phase. Default ownership:

- copy chief: content files, MDX, string constants, alt text wording
- search strategist: `<head>` metadata, `generateMetadata`, JSON-LD components, `robots.ts`, `sitemap.ts`, `llms.txt`
- builder: layout, components, styles, tokens
- motion director: files under a motion or animation folder, or new motion wrappers
- GPU artist: exactly one GPU surface component per page and its poster still
- media producer: `public/` assets and their `.vis.provenance.json` sidecars

If a change needs a file another role owns, hand it over in the phase file.

## Gates no route skips

- **Repo truth outranks the plugin.** The repo's design and taste files, and the
  brand pack they name, beat every skill here. On conflict, the repo wins.
- **Evidence or silence.** A claim about how a page looks needs a screenshot from
  this session. A claim about a number needs the command that produced it.
- **Mobile first.** The 375 capture passes before desktop polish begins.
- **Reduced motion is a designed state**, not a disabled one.
- **Human gates.** The studio prepares; a person approves: new public pages or
  routes, prices and checkout, DNS and domains, external sends, removal of more
  than half a page, and any paid generation (Higgsfield runs only after an
  approved plan for that campaign). Draft PRs only; merging goes through the
  repo's review gate with a different reviewer than the maker.
- **Stop rule.** Three critique rounds without a ship verdict ends the run with a
  written blocker, not a fourth round.

## Hand-off

End every run with `.studio/<target-id>/handoff.md`: route taken, files changed,
scores before and after, critic verdict and provider, verifier verdict, what was
declined and why, and the next proposal.
