# Premium Intelligence Web OS

> A control plane for creating cinematic, AI-native brand websites. It turns taste, design, motion, 3D, copy, and quality gates into explicit constraints so coding agents execute with less ambiguity and more repeatability.

This is **not** a component library and **not** a one-off landing page. It is the operating system future agents (Claude / Codex / Cursor / Gemini) read **before** building, so the output is premium by construction instead of premium by luck.

---

## Why this exists

Coding agents are strong at implementation and weak at the things that make a site feel expensive: taste synthesis, brand hierarchy, motion restraint, performance discipline, and knowing what "premium" actually means without constraints. They over-animate, ship template-looking output, hallucinate packages, and lose context between sessions.

This OS compensates by replacing vague prompts ("make it cinematic") with an explicit, checkable system: a taste rubric, a token-binding contract, a motion grammar, a 3D budget, and quality gates that block shipping until the bar is met.

---

## How agents use this folder

**Minimum reading before any build** (in order):
1. [`CLAUDE.md`](./CLAUDE.md) — the operating rules (or [`AGENTS.md`](./AGENTS.md) for non-Claude agents).
2. [`_intelligence/operating-system.md`](./_intelligence/operating-system.md) — the build sequence and how the pieces fit.
3. [`_intelligence/taste.md`](./_intelligence/taste.md) — what premium means, operationally.
4. [`_intelligence/brand-worlds.md`](./_intelligence/brand-worlds.md) — the brand you're building for + its real token source.

Then, scoped to the task: [`design.md`](./_intelligence/design.md), [`motion.md`](./_intelligence/motion.md), [`three-webgl.md`](./_intelligence/three-webgl.md), [`copywriting.md`](./_intelligence/copywriting.md).

**The build sequence is non-negotiable:**
> read docs → page spec → scene brief → static composition → motion → 3D → polish → QA → decision log.

Skipping straight to code from a vague adjective is the failure mode this OS exists to prevent.

---

## What this OS is built on (it unifies, it does not duplicate)

It is a **meta-layer**. It does not re-author brand taste — it references the canons that already exist and adds the cross-brand grammar + the motion/3D/QA discipline that was previously tribal knowledge:

- **Brand canons** stay where they live: Arcanea `TASTE.md` / `DESIGN.md` / `@arcanea/design-system`; FrankX `design.md` / `taste.md` / `lib/design-system.ts`.
- **Motion vocabulary** is codified from the production `@arcanea/design-system` motion exports.
- **3D patterns** are codified from shipped components (R3F hero scenes, raw-shader orbs).
- **Quality gates** wire the existing gstack `plan-design-review` + Arcanea `design-verifier`.

See [`_intelligence/brand-worlds.md`](./_intelligence/brand-worlds.md) for the token-binding contract.

---

## Consuming the OS

**As a portable skill / slash command (any repo, any agent):** install `free-skills/premium-web-os` from this registry (or copy to `~/.claude/skills/`). Invoke with `/web-os` (aliases `/wos`, `/wde`). It auto-activates on intent like "build a premium landing page" or "make this hero cinematic." See [`_intelligence/agent-manual.md`](./_intelligence/agent-manual.md).

**Mirrored into a web repo:** copy `_intelligence/` to the target repo root. If that repo has its own brand canon, the mirrored docs cross-reference it instead of duplicating values.

---

## The bar: template output vs premium output

| Dimension | Template output | Premium output |
|---|---|---|
| First viewport | Generic hero, centered, gradient | One dominant idea, deliberate hierarchy, a memorable object |
| Motion | Cargo-culted defaults, everything moves | Choreographed, rare, serves attention |
| 3D | Floating blobs for decoration | A brand metaphor with a performance budget and a fallback |
| Layout | Equal-card grids | Scenes with editorial rhythm and earned density |
| Copy | "AI-powered solution for your business" | Mechanism, specificity, category claim |
| Color | Random gradients | Controlled palette bound to brand tokens |
| Performance | Whatever ships | Budgeted; CWV targets are part of the design |

Full scoring: the 1–5 rubric in [`_intelligence/taste.md`](./_intelligence/taste.md).
