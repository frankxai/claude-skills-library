# Brand Worlds

Three brand-world specs + the **token-binding contract**. The OS never invents brand values — each world points to the real token source where concrete color/type/space/motion values live. When mirrored into a brand repo, bind to that repo's canon.

---

## Starlight Intelligence Systems

**World:** nocturnal intelligence lab meets mythic oracle system.
**Mood:** dark, precise, cinematic, sovereign, quiet power.
**Materials:** obsidian, smoked glass, brushed metal, starlight, faint plasma, luminous grid.
**Motion:** slow, gravitational, inevitable, orbital.
**Visual metaphors:** intelligence core · constellation graph · command observatory · signal field · oracle interface · star map.
**Copy posture:** strategic, architectural, sovereign, high-trust.
**Avoid:** playful SaaS, cartoon AI, neon hacker cliché, generic dashboards.
**Token source:** no production web app yet — define tokens fresh from this world (dark base, ~2 accents: starlight + a cool plasma), then promote to a `design-system` when a Starlight site lands.

---

## Arcanea

**World:** mythic creative operating system; spellcraft meets advanced interface.
**Mood:** mystical, artistic, luminous, deep, transformational — but **AI-lab premium, never fantasy-game** (mythology lives in the content, not the chrome).
**Materials:** ancient paper, dark glass, gold foil, ink, moonlight, portal light.
**Motion:** ritualistic, unfolding, portal-like, layered.
**Visual metaphors:** codex · portal · sigil · constellation · creative forge · spell-interface.
**Copy posture:** mythic but precise; poetic but not vague. Verbs over adjectives.
**Avoid:** fantasy cosplay, purple cliché, unreadable ornament, Hz frequencies in UI, Cinzel/Space Grotesk/Inter.
**Token source (binding):** `@arcanea/design-system` (tokens + motion + brand-kits) · authority order `TASTE.md` → `DESIGN.md` → `@arcanea/design-system` → `apps/web/CLAUDE.md`. Palette: Atlantean Teal `#00bcd4`, Cosmic Blue `#0d47a1`, Gold `#ffd700`, base `#09090b`. Fonts: Geist + Instrument Serif + Geist Mono. Glass: `bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm`.

---

## FrankX.ai

**World:** executive AI command layer for leverage, sales, capital, growth.
**Mood:** sharp, direct, elite, tactical, controlled.
**Materials:** black glass, graphite, market screens, signal lines, brushed metal.
**Motion:** fast but precise, decisive, minimal.
**Visual metaphors:** cockpit · deal room · intelligence console · agent swarm · growth engine · signal radar.
**Copy posture:** ruthless clarity, leverage, outcomes, systems. "AI Architect" stays "AI Architect" (never "AI Systems Architect").
**Avoid:** generic AI-assistant aesthetic, cute bots, soft startup gradients.
**Token source (binding):** `lib/design-system.ts` + `tailwind.config.js`; judgment from root `design.md` + `taste.md`. Dual-spectrum tokens (tech/soul + ana). Never rename working URLs or "consolidate" by deletion.

---

## Cross-brand shared principles

All three share: dark editorial base · controlled palette (≈2 accents) · large confident typography · scene-based layout with editorial rhythm · slow/precise motion · one cinematic moment per page · glass/obsidian material family · honest claims only. The OS taste/design/motion/3D docs apply to all three.

## Reuse vs. unique

- **Reuse across brands:** the OS docs, the build sequence, the quality gates, the motion *vocabulary* (variant names/easings/timings), the 3D patterns and budgets, the component *standards*.
- **Unique per brand:** concrete token values, the hero metaphor, the voice register, the specific material palette, and any signature scene. Two brands may share a `heroReveal` primitive; they must not share a hero *look*.

## The token-binding contract (rule)

1. The OS `design.md` defines token **categories**.
2. Each brand world above names the **source file** for concrete values.
3. App code references tokens from that source — **no raw hex inline.**
4. If a brand's token migration is incomplete, follow that repo's migration plan; never add new raw-hex debt.
