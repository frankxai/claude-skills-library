---
name: design-asset-intake
description: Triage an external GitHub design/UI/motion/shader library before wiring it into any site's design system. Use when someone shares a "free design asset library" repo/link (social media, a README, a tweet), when deciding whether to npm-install, vendor-copy, or just study a repo, or when logging a new entry in registries/design-assets.json.
---

# Design Asset Intake

Design-asset repos show up constantly (social media roundups, "awesome-X" lists, a
friend's link). Most get bookmarked and forgotten. This skill makes absorbing one into
a real site a repeatable, five-minute triage instead of a one-off copy-paste.

## When to use this

- Someone shares a GitHub repo billed as a design/UI/animation/shader "asset library."
- You're deciding whether a repo should become an npm dependency, vendored source, or
  just a technique to study.
- You're about to add a new entry to `registries/design-assets.json`.
- You're wiring a new primitive into a site's design system (e.g. `@arcanea/design-system`
  or a FrankX `lib/design-system.ts` consumer) and need to know where it came from.

## The triage

Before touching any site repo, classify the source repo into exactly one of three types.
Read its README/package.json first — don't guess from the marketing post.

1. **npm-dependency** — it publishes a real package to npm (check the README's install
   snippet, or `npm view <name>`). Just add it to the consuming app's `package.json` like
   any other dependency. Note its peer deps (e.g. a three.js-based library usually wants
   `@react-three/fiber` + `three` already present).
2. **vendor-copy** — no npm package exists, but the source is small, self-contained, and
   meant to be copied (vanilla JS/CSS files, a single component file, "no build step" in
   the README). Copy the actual source files into the target design-system package under
   its own primitives convention (e.g. `src/primitives/<name>/` in `@arcanea/design-system`,
   `components/ui/primitives/<name>/` in FrankX — check the target repo's own layout rather
   than assuming), wrapped in whatever component API the design system expects. Never leave
   vendored code un-wrapped or inconsistent with the rest of the primitives.
3. **reference-study** — the repo is a demo app, a playground, or otherwise not meant to
   be installed or copied wholesale (e.g. a Next.js showcase for a shader technique). Do
   **not** vendor the whole app. Extract the specific technique (the shader, the easing
   curve, the layout trick) and hand-author ONE new primitive inspired by it, the same way
   existing hand-ported primitives (e.g. Magic UI ports in `@arcanea/design-system`) were
   built. Log it as reference-only; building the derived primitive can be a separate,
   later step.

When unsure between vendor-copy and reference-study, the test is: "would I ever run
`npm install` or `cp` this repo's actual source into my repo?" If yes and the surface
area is small, vendor-copy. If the repo is really an app/demo, reference-study.

## Log the entry

Every adopted (or explicitly reference-logged) library gets one entry in
[`registries/design-assets.json`](../../registries/design-assets.json) at the repo root:

```json
{
  "name": "<library name>",
  "source_url": "<github url>",
  "integration_type": "npm-dependency | vendor-copy | reference-study",
  "package": "<npm package name, or null>",
  "requires": ["<peer deps>", "..."],
  "target_design_system": ["<consuming repo/package path>"],
  "added_date": "<YYYY-MM-DD>",
  "brand_fit_notes": "<why it fits, how it's wrapped, any restraint rule it must obey>"
}
```

This is the single place to check before re-triaging something that's already been
absorbed, and the place a future agent (or Frank) looks first when asked "have we already
looked at X?"

## Route through the brand gate

A registry entry is not a ship decision. Every new primitive built from an intake still
has to pass the target site's existing brand gate before it's called done:

- FrankX (`frankx.ai-vercel-website`/`FrankX`): `taste.md`'s 8-step polish pass, gated by
  the `visual-brand-guidelines` agent.
- Arcanea (`arcanea-ai-app`): `TASTE.md`'s 7-gate bar, routed through the
  `design-architect` -> `design-generator` -> `design-motion` -> `design-verifier` agent
  pipeline (that pipeline already exists specifically to intake external patterns and
  refactor them into brand tokens — use it, don't bypass it).

Heavier effects (WebGL, shader, 3D) are opt-in for a single deliberate hero moment per
page — they supplement the existing default look, they don't quietly become the new
default. If a change would replace an existing locked visual signature (e.g. a fixed
glass-card recipe), that's a call for the human, not something this skill decides.

## Distributing a new primitive to other sites

Once a primitive is built and gated in one design system, don't hand-recreate it in
every other repo. For skills, the sibling `starlight-agent-skills` repo (a different
repo from this one) has a sync script, `scripts/port-skill.mjs <domain/skill>
--target=<repo>` — but it assumes that repo's own nested `domain/skill` + `manifest.json`
shape, which doesn't match this repo's flat `free-skills/<name>/SKILL.md` layout, so it
won't run as-is against a skill copied from here. For a flat skill like this one, a plain
folder copy into the target repo's own skill convention (checking whether it's
`.claude/skills/` or something else — some repos gitignore `.claude/skills/*/` and keep
the committed copy elsewhere, e.g. `.arcanea/skills/`) is the practical fallback. For code
primitives, copy the file plus add its export to the target design-system's index. Either
way, add the target repo to the registry entry's `target_design_system` list so the
registry stays the accurate cross-repo record.
