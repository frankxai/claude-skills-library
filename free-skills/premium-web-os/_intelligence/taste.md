# Taste Operating System

The judgment layer the schema can't capture. When tokens and taste disagree, taste wins — tokens make a thing buildable; taste makes it worth shipping.

## Prime Directive

**Premium is not more effects. Premium is compression, restraint, hierarchy, materiality, and inevitability.**

A page is premium when every visual decision supports one of: **status, clarity, trust, tension, memorability, narrative control.** If a decision serves none of these, remove it.

## Core Taste Principles

1. **One dominant idea per viewport.** If a screen says two things, it says nothing.
2. **One visual focal point per scene.** Everything else is support.
3. **Motion serves hierarchy, never decoration.**
4. **Negative space is a luxury signal.** Crowding reads as cheap.
5. **Typography carries authority before effects do.** Get type right and you need less of everything else.
6. **Materials must feel intentional** — glass, metal, paper, light, shadow, signal — not random.
7. **The interface should feel designed, not assembled.** No "components bolted together" seams.
8. **Silence beats clutter.**
9. **Restraint beats novelty.**
10. **Depth comes from layering, not chaos.** A few deliberate layers, not many fighting ones.

## Premium Signals (aim for these)

- Controlled palette (≈2 accents, bound to brand tokens). High contrast where it matters.
- Editorial typography with a real scale and a confident display size.
- A strong grid — and deliberate asymmetry that breaks it on purpose.
- Atmospheric depth (subtle gradient, faint noise, considered shadow) — not flat, not busy.
- Expensive motion: slow, gravitational, choreographed.
- Minimal but precise copy. Strong nouns, short lines.
- Scene-based layout with a memorable first viewport.

## Cheap Signals / Anti-patterns (banned)

- Generic purple→blue/pink SaaS gradients (the single most overused AI-tool look).
- Bouncy/elastic default animations; random particle spam; constant floating.
- Icon grids with no story; excessive glowing cards; fake glassmorphism overload.
- Center-aligned everything (>60% of text centered).
- Stock dashboard mockups, stock photography, generic 3D renders.
- Meaningless 3D objects (decorative blobs).
- Huge paragraphs; unstyled default buttons; template hero sections.
- "AI-powered solution for your business" generic copy.
- Inconsistent radii/shadows; random font pairings; animation without choreography.
- Emoji as icons; Unicode glyphs (✦ ◈ ⌥) as icons — per-OS fallback, reads unfinished.

## The Taste Rubric (1–5)

Score each axis. **1 = template/sloppy · 3 = decent but generic · 5 = premium/cinematic/ownable.** A flagship scene targets ≥4 on every axis and 5 on its focal axis.

| Axis | 1 | 3 | 5 |
|---|---|---|---|
| Composition | random blocks | tidy grid | deliberate, asymmetric, inevitable |
| Hierarchy | flat | clear primary/secondary | guides the eye like a film cut |
| Typography | default stack | decent pairing | editorial, confident, ownable |
| Color / material | random gradients | on-brand but flat | controlled, atmospheric, material |
| Motion | none or chaotic | tasteful fades | choreographed, gravitational |
| 3D integration | decorative/none | present, generic | a brand metaphor with depth |
| Brand specificity | could be anyone | mostly on-brand | unmistakably this brand |
| Originality | template | derivative | a fresh, ownable execution |
| Polish | rough edges | clean | obsessive detail, no seams |
| Performance perception | janky | fine | instant, smooth, weightless |

## First Viewport Rule

The first viewport must look premium **before** the user scrolls. It must contain: a dominant claim, clear spatial hierarchy, a memorable visual object or scene, intentional typography, a controlled palette — and zero placeholder aesthetic.

## Visual Silence Rule

At least **40–60%** of a premium composition should be visually quiet. Do not fill every region. Quiet is what makes the focal point land.

## Agent Translation Rule

When you receive a vague word — *premium, cinematic, immersive, luxury, high-end, award-winning* — do not act on the vibe. Translate it into constraints first:

| Vague word | Layout | Material | Motion | Typography | Interaction | Performance |
|---|---|---|---|---|---|---|
| **premium** | generous gutters, one focal point, 40–60% quiet | controlled palette, faint noise, considered shadow | slow reveals, no bounce | large confident display, tight tracking | restrained hover, no scale-spam | instant; no jank |
| **cinematic** | scene-based, full-bleed moments, editorial rhythm | atmospheric depth, rim light | scroll-scrubbed sequence, one pinned beat | oversized display line, mask reveal | parallax on scroll, not on hover | 60fps scroll, lazy 3D |
| **immersive** | viewport-scale scenes | layered depth, ambient gradient | camera/scroll progression | minimal chrome, let the scene breathe | scroll drives the story | DPR cap, bounded particles |
| **luxury** | asymmetry, vast negative space | glass/metal/paper, gold-restraint | barely-there ambient drift | serif/editorial accent, precise | almost none — confidence | flawless, weightless |

**Worked example.** Ask: "make the hero feel premium and cinematic." Translation: full-bleed hero, one display line + one sub-line + one CTA (no paragraph), a single 3D/atmospheric focal object, palette = 2 brand accents on dark base, motion = `heroReveal` blur-to-focus on load + one scroll-scrubbed camera beat (no hover scale), type = oversized display with `[0.16,1,0.3,1]` expo reveal, performance = 3D lazy-loaded with a static poster, CWV budget enforced. *That* is a buildable brief; "premium and cinematic" is not.

## How taste is used

- **Before any scene:** read this file; confirm the scene's dominant idea and rubric targets.
- **During build:** the static composition must hit hierarchy/typography/color before motion is added.
- **At the gate:** `checklists/taste-check.md` scores the rubric; below target → iterate, don't ship.
- **Brand specificity** comes from the brand's own canon — see `brand-worlds.md`. This file is cross-brand; the brand files add the specific judgment.
