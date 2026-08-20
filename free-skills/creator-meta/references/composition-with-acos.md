# How `creator-meta` Composes with ACOS v11

_The relationship between the global creator-meta substrate and the ACOS plugin._

## The composition

```
┌──────────────────────────────────────────────────────────────────┐
│  ACOS v11 plugin                                                   │
│  ~/agentic-creator-os/.claude-plugin/plugin.json                  │
│                                                                    │
│  "compose": {                                                      │
│    "extends": ["creator-meta"]                                     │
│  }                                                                 │
└─────────────────────────┬────────────────────────────────────────┘
                          │ inherits structure from
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  creator-meta (global skill)                                      │
│  ~/.claude/skills/creator-meta/                                   │
│                                                                    │
│  - Abstract 6-layer model                                          │
│  - "Where does X go?" decision tree                                │
│  - Brand-discipline framework                                      │
│  - Bootable template for <creator>-meta children                   │
└─────────────────────────┬────────────────────────────────────────┘
                          │ specialized by
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  <creator>-meta (project skill, per creator)                      │
│  ~/<creator>/.claude/skills/<creator>-meta/                       │
│                                                                    │
│  - Concrete paths                                                  │
│  - Creator brand voice                                             │
│  - Sibling repo inventory                                          │
│  - Boundary walls per substrate                                    │
└──────────────────────────────────────────────────────────────────┘
```

## What each layer contributes

### `creator-meta` contributes (the global substrate)

- **Layer model contract:** L0 → L5 with role definitions
- **Decision tree:** Q1-Q6 abstract walk
- **5 meta-rules:** layer-before-content, canonical-wins, brand-walls, substrate-own-repo, human-gated-prod
- **Boot template:** how to create a new `<creator>-meta` from scratch
- **Brand-discipline framework:** how to write voice rules per creator

### ACOS v11 contributes (the operating system)

- **Concrete skills:** content-strategy, blog-writing, video-script, social-media, seo-optimization, etc. (10 shipped, more aspirational)
- **MCP integration:** registered MCPs for filesystem, brand, content
- **Hooks:** lifecycle events (SessionStart, PreToolUse, PostToolUse, Stop)
- **Multi-platform adapters:** Claude Code, OpenCode, Cursor, Windsurf, Gemini CLI
- **Intelligence scoring:** `/acos-score` measures system performance over sessions
- **Self-learning:** trajectory storage, pattern extraction, neural-train (aspirational)

### `<creator>-meta` contributes (the project specialization)

- **Concrete paths:** "L1 = `docs/`, L4 = `app/`, etc."
- **Brand voice:** specific tone, lexicon, anti-patterns
- **Substrate boundaries:** which sibling repos exist, what brand walls apply
- **Ecosystem inventory:** the systems shipped in this creator's stack
- **Verification commands:** how to re-audit canonical-locations table

## Why this composition matters

Without `creator-meta`:
- Every creator project re-invents the layer model
- ACOS can't declare a substrate (only specific implementations)
- Drift between creator setups is invisible (no shared abstraction)

Without ACOS v11:
- The layer model has no concrete tooling
- Each creator builds skills from scratch
- No measurable intelligence-over-time

Without `<creator>-meta`:
- Layer model stays theoretical (no concrete paths)
- ACOS skills don't know where to write outputs
- Brand voice is undefined

## Installation order for a new creator

Suggested:

1. **Install ACOS v11 plugin** from `~/agentic-creator-os/`
   - This pulls in `creator-meta` automatically (declared as extends)
   - Provides 10+ creator skills (content, video, music, brand)

2. **Boot `<creator>-meta`** project skill
   - Use `~/.claude/skills/creator-meta/references/template-creator-meta.md`
   - Specialize paths, voice, substrate

3. **Add creator-specific data**
   - `data/ecosystem.ts` — your shipped systems
   - `data/crm/*.json` — your CRM (if applicable)

4. **Optional: install other plugins**
   - `library-os` — book intelligence
   - `frankx-brand` (if Frank's voice fits) — or build your own
   - `superpowers` — proven techniques (TDD, debugging, planning)

## Anti-patterns

- **Don't fork creator-meta** — inherit it. Forking causes drift; inheritance keeps you upgradable.
- **Don't put creator-specific paths in creator-meta** — that's what `<creator>-meta` is for.
- **Don't skip the project specialization** — ACOS skills will fail without concrete paths.
- **Don't install ACOS without `<creator>-meta`** — works, but every "where does X go?" question lacks an answer.

## How it lands in practice (FrankX example)

```
~/agentic-creator-os/                      ← ACOS v11 plugin (installed)
   .claude-plugin/plugin.json
      compose.extends = ["creator-meta"]    ← inherits substrate

~/.claude/skills/creator-meta/             ← global substrate (this skill)
   SKILL.md                                  ← abstract layer model
   references/                               ← decision tree, template, etc.

~/frankx/.claude/skills/frankx-meta/       ← project specialization (FrankX)
   SKILL.md                                  ← concrete: docs/, app/, .intake/
   references/canonical-locations.md         ← real paths
   references/ecosystem-inventory.md         ← 28 FrankX systems
   references/brand-discipline.md            ← FrankX voice + Arcanea wall
```

When Frank asks "where does this go?" inside `~/frankx/`:
1. `frankx-meta` activates (project skill, most-specific match)
2. It references `creator-meta` (parent) for any abstraction not specialized
3. ACOS v11 plugin's command/skill ecosystem is available throughout

When Frank asks the same in a new creator project:
1. The new `<creator>-meta` activates instead
2. It also references `creator-meta` for the abstraction
3. Same ACOS plugin is reused (it's creator-agnostic at the substrate level)

## Versioning the composition

Each layer versions independently:

- `creator-meta` — semantic version (this skill, currently v1.0.0)
- ACOS plugin — `version: "11.0.0"` in `.claude-plugin/plugin.json`
- `<creator>-meta` — per-creator versioning

When `creator-meta` ships a breaking change (new layer, removed rule), child skills should explicitly opt-in by bumping their stated parent version.

## Future directions

- **Plugin marketplace registration** — ACOS publishable to `frankxai/marketplace` or similar
- **Multi-creator marketplaces** — others can publish their `<creator>-meta` packs
- **Substrate composition** — `creator-meta` itself could compose other meta-skills (e.g., `multi-platform-meta` for sub-substrates)

These are deferred until usage data justifies them.
