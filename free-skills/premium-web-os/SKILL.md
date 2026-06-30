---
name: premium-web-os
description: Build cinematic, premium, 3D/motion-rich websites with taste and repeatability. Use when designing or building a landing page, hero, marketing site, product page, or any UI that must feel high-end/premium/cinematic — or when reviewing a site for premium polish, motion discipline, or AI-slop. Slash command /web-os (aliases /wos, /wde). Works in any repo with Claude, Codex, Cursor, or Gemini.
version: 1.0.0
license: MIT
---

# Premium Intelligence Web OS

A control plane that constrains agents to produce premium, cinematic web output instead of template-looking output. It unifies existing brand canons, codifies a motion + 3D grammar, and wires quality gates — so "make it premium" becomes a checkable system.

## When to use

- Building a landing page, hero, marketing site, product page, or any premium/cinematic UI.
- Adding scroll choreography, motion, or 3D/WebGL to a site.
- Reviewing/upgrading an existing page for premium polish or motion restraint.
- Establishing a repeatable design bar across multiple sites/brands.

## How to invoke

- Slash command: `/web-os` (aliases `/wos`, `/wde`).
- Or just describe the intent ("build a premium landing page", "make this hero cinematic") — it auto-activates.

## What it does (build sequence — do not skip)

1. **Read the canon** — `_intelligence/operating-system.md`, `_intelligence/taste.md`, `_intelligence/brand-worlds.md`, then scoped `_intelligence/design.md` / `_intelligence/motion.md` / `_intelligence/three-webgl.md` / `_intelligence/copywriting.md`.
2. **Intake** — turn the vague ask into verifiable targets (`_intelligence/workflows/00-intake.md`).
3. **Reference board** — deconstruct references into reusable principles, never copies (`_intelligence/workflows/01-reference-board.md`, `_intelligence/reference-deconstruction.md`).
4. **Art direction + scene brief + asset plan** — lock the dominant idea + the asset manifest (`_intelligence/templates/scene-brief.template.md`, `_intelligence/templates/asset-manifest.template.md`).
5. **Asset production** — generate imagery / 3D-GLB / video via the gen-lanes + Higgsfield, gated (`_intelligence/visuals.md`, `_intelligence/workflows/03b-asset-production.md`). Degrades to procedural/poster without keys.
6. **Build static composition** — layout, type, hierarchy, color bound to brand tokens. No motion yet.
7. **Motion pass** — choreographed, one cinematic moment per page (`_intelligence/motion.md`).
8. **3D/video integration** — generated GLB (`useGLTF`) or hero `<video>`, or procedural; always with fallback (`_intelligence/three-webgl.md`).
9. **Polish + Visual QA + Performance** (`_intelligence/checklists/`).
10. **Release gate → distribute (VIS per-platform) → handover + decision log + registry** (`_intelligence/checklists/release-check.md`, `_intelligence/templates/handover.template.md`).

## Multi-agent mode

When the host repo has design subagents, compose them: `design-architect` → `design-generator` → `design-motion` → `design-verifier`. Otherwise run the same phases single-agent.

## Core rules (enforced)

- Don't build from a vague adjective — scene brief first.
- Don't animate everything — motion serves hierarchy.
- No raw hex — bind to the brand token source.
- No undeclared dependencies; verify APIs from source.
- No 3D without fallback + mobile + reduced-motion.
- No stock SaaS layouts, random gradients, emoji/glyph icons, equal-card grids, invented metrics, or copied sites.

## Where the full system lives

The complete OS (docs, workflows, prompts, templates, checklists, examples) is in the `free-skills/premium-web-os/_intelligence/` tree of this repo. Mirror `_intelligence/` into a target web repo to run the OS locally there.
