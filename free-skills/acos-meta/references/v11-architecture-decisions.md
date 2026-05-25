# ACOS v11 — Architecture Decisions

_The integration rationale referenced in `acos-meta/SKILL.md`. Verified 2026-05-03 against the actual ACOS state at `~/agentic-creator-os/`._

## 0 · The aspiration vs. reality gap

`docs/ACOS_V11_MASTER_PLAN.md` describes v11 as: dual-platform (Claude Code + OpenCode), self-learning, video-ready, upstream-sync, target intelligence score 98, 90+ skills, 65+ commands, 38 agents, 8 plugins.

**The actual state at `~/agentic-creator-os/` (v11.0.0) is:**
- 10 skills in `skills/` (content-strategy, blog-writing, content-strategy, creative, newsletter, seo-optimization, social-media, soulbook, technical, video-script)
- `commands/` exists but empty
- `docs/` has the master plan + 16 other docs
- `package.json` correctly declares v11.0.0
- `bin/acos-sync.sh` + `bin/acos-enhance` shipped
- `.claude-plugin/plugin.json` **shipped 2026-05-03** (this F1 sprint)
- No `.sisyphus/`, no `.swarm/`, no `.memory/`, no `.video/`, no `.opencode/` directories yet

**Honest framing:** v11 is the **vision**, not the **shipped state**. The plugin manifest now declares v11 reality (10 skills, not 90+), and the aspirational architecture lives in `ACOS_V11_MASTER_PLAN.md` for incremental implementation.

## 1 · Why a `.claude-plugin/plugin.json` matters

Without it, ACOS cannot be installed via Claude Code's plugin system. It can only be `git clone`'d and manually wired. The plugin manifest:

- Makes ACOS Claude-marketplace-discoverable
- Documents `compose.extends` (the creator-meta inheritance chain)
- Documents `compose.absorbs` (knowledge-work-plugins, superpowers, oh-my-opencode, claude-flow)
- Surfaces honest stats (10 skills shipped vs. aspirational 90+) so users aren't misled
- Pins `intelligence` metadata for tracking score progression v8 → v9 → v10 → v11

Path: `~/agentic-creator-os/.claude-plugin/plugin.json`

## 2 · Why a global `creator-meta` skill

Tonight's F1 sprint shipped `frankx-meta` (project-scope, FrankX-specific). The `creator-meta` skill (global, this session) generalizes the layer model so **any creator** can boot the same pattern.

```
creator-meta (global, abstract)        ← any creator inherits this
   │
   ├── frankx-meta (project, FrankX)   ← Frank's specific instance
   ├── (future) starlight-meta         ← if SIS becomes its own creator-OS
   └── (future) <other-creator>-meta   ← any user who installs ACOS
```

**The contract:**
- `creator-meta` defines the 6-layer model abstractly (L0 intake / L1 second brain / L2 command / L3 data / L4 face / L5 substrate) without naming specific paths.
- Project-scope `<name>-meta` skills inherit and specify: "L1 Second Brain in this project lives at `docs/`"; "L4 Public Face surfaces at `app/`"; etc.
- Skills, commands, agents at the project level can override but should follow the inherited shape.

This is the [knowledge-work-plugins](https://github.com/frankxai/knowledge-work-plugins) pattern — connector-agnostic skills with concrete bindings declared per project.

## 3 · How the three layers compose

```
┌─────────────────────────────────────────────────────────────────────┐
│  ACOS v11 plugin (~/agentic-creator-os/)                             │
│  - 10 production skills                                              │
│  - npm package + Claude plugin manifest                              │
│  - Aspirational architecture in ACOS_V11_MASTER_PLAN.md              │
│  - declares: compose.extends = [creator-meta]                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ extends
┌────────────────────────────▼────────────────────────────────────────┐
│  creator-meta (global skill, ~/.claude/skills/creator-meta/)         │
│  - Abstract 6-layer model                                            │
│  - "Where does X go?" decision tree (placeholder paths)              │
│  - Brand-discipline framework (creator + substrate boundaries)       │
│  - No creator-specific names, paths, or vocabulary                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ specialized by
┌────────────────────────────▼────────────────────────────────────────┐
│  frankx-meta (project skill, ~/frankx/.claude/skills/frankx-meta/)   │
│  - Concrete paths: docs/, .intake/, app/ecosystem/, data/           │
│  - 28-system inventory specific to FrankX                            │
│  - FrankX brand voice: "Elite Creator. AI Architect. Humble"         │
│  - Hard wall: no Arcanean mythology in FrankX surfaces               │
└─────────────────────────────────────────────────────────────────────┘
```

## 4 · Absorption decisions

ACOS v11 absorbs patterns from:

| Source | What gets absorbed | Where it lands |
|---|---|---|
| **knowledge-work-plugins** | Progressive disclosure, connector agnosticism, command workflow format, plugin manifest schema | All new skills + this manifest |
| **superpowers** v5.0.7 | Brainstorming, executing-plans, writing-plans, TDD, debugging discipline | Already global, ACOS doesn't duplicate |
| **oh-my-opencode** (32.5k ⭐) | Lifecycle hooks (Sisyphus / Hephaestus pattern), magic words (`ultrawork`), todo-continuer, comment-checker | Aspirational — lives in ACOS_V11_MASTER_PLAN.md as `.sisyphus/` |
| **claude-flow** (100+ skills) | Swarm topologies (hierarchical / mesh / star / ring / adaptive), agent type taxonomy | Aspirational — lives in ACOS_V11_MASTER_PLAN.md as `.swarm/` |
| **arcanea-meta** | Self-describing meta-skill pattern, canonical-locations table, absorption-log discipline | Mirrored in creator-meta + frankx-meta |
| **superintelligence** (Arcanea) | Multi-agent dispatch capability, intent classification | Used as a CAPABILITY, never lexicon (brand-walled) |

**Anti-pattern avoided:** ACOS does NOT vendor copy the upstream sources. It absorbs *patterns* with provenance. See `references/absorption-log.md` (when it exists).

## 5 · The frankx + sis + acos shipping pattern

Frank ships three product lines in parallel that form one ecosystem:

| Product | Repo | License | Brand | Role |
|---|---|---|---|---|
| FrankX | `frankxai/FrankX` (private dev) → `frankx.ai-vercel-website` (production) | n/a (proprietary site) | "Elite Creator. AI Architect. Humble Excellence." | The site, the funnel, the public face |
| Starlight Intelligence System | `frankxai/Starlight-Intelligence-System` | MIT | Substrate-academic | The framework anyone can fork |
| ACOS | `frankxai/agentic-creator-os` | MIT | Creator-tooling | The operating system that powers the work |

**The shipping cycle:**

1. New capability is built in FrankX repo first (concrete instance).
2. When the pattern hardens, it gets generalized into one of:
   - SIS (if it's a foundational architecture concept)
   - ACOS (if it's a creator-tooling pattern)
   - knowledge-work-plugins (if it's broader than creator-specific)
3. The substrate repo ships with MIT license and dedicated brand.
4. The frankx surface continues to *use* the substrate but never *contains* it.

This is mirrored from how Arcanea ships (the ecosystem-map.md pattern in arcanea-meta).

## 6 · Honest v11 readiness scorecard

Per the `intelligence` block in `plugin.json`:

| Component | Weight | Current state |
|---|---|---|
| Skill activation accuracy | 25% | 10 skills, no measured trajectory data yet |
| Pattern extraction quality | 25% | n-gram extraction not active (aspirational) |
| Memory utilization | 20% | Memory is in `~/.claude/projects/.../memory/`, used but not measured |
| Hook reliability | 15% | Hooks exist in FrankX repo `.claude/hooks/`, ACOS `hooks/` directory empty |
| Self-modify safety | 15% | No self-modify gate yet (aspirational) |

Run `/acos-score` against the *real* ACOS state, not the master plan. Treat 65-72 as a realistic 2026-05-03 score. The 98 target is achievable but requires shipping the .sisyphus / .swarm / .memory directories first.

## 7 · What this doc unblocks

The acos-meta SKILL.md references `references/v11-architecture-decisions.md` (line 147). Without this file, the skill can't deliver on its description. With it shipped:

- ✅ Future Claude sessions reading acos-meta get full v11 context
- ✅ The compose chain (creator-meta → frankx-meta or other-creator-meta) is documented
- ✅ Honest aspiration vs. reality gap is acknowledged (no false claims)
- ✅ Absorption decisions are traceable

## 8 · Next decisions for Frank

| # | Decision | Why |
|---|---|---|
| 1 | Publish ACOS plugin to a marketplace? | Currently no `.claude-plugin/marketplace/` registered. Could go on `frankxai/marketplace` if Frank wants public discovery. |
| 2 | Clone `knowledge-work-plugins` locally? | Currently only referenced. If we want to genuinely absorb patterns, local clone + absorption-log entries. |
| 3 | Ship `.sisyphus/` from oh-my-opencode? | Big task — magic-words, hash-edit, parallel-exec. Worth a dedicated sprint. |
| 4 | Migrate FrankX `.claude/hooks/` → ACOS hooks? | Currently FrankX has hooks; ACOS hooks/ folder empty. Either consolidate or document the divergence. |

These are deferred to Frank's morning review. The meta-layer ships tonight; the implementation is incremental.

## 9 · References (within this skill)

- `SKILL.md` — the lean entry point
- `references/canonical-locations.md` — _when shipped_, full path table for ACOS
- `references/ecosystem-map.md` — _when shipped_, repo inventory
- `references/installed-stack.md` — _when shipped_, real verified counts
- `references/absorption-log.md` — _when shipped_, provenance for upstream pattern adoption
- `references/validation-contract.md` — _when shipped_, the 5-layer validation contract

These remaining references are scaffolded but not all populated. Each can be shipped as a dedicated F-session.
