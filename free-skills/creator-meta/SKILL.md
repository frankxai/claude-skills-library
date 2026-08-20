---
name: creator-meta
description: "Creator-agnostic operating-system substrate. The abstract layer model + decision tree + brand-discipline framework that any creator can inherit and specialize. Use when designing a new creator's repo structure, asking 'what layer does X belong to?', booting a new creator's Claude Code config, or reasoning about the creator-tooling stack independent of any specific creator. Trigger phrases: creator meta, creator system map, creator OS, what layer does X go in, creator layer model, generalize for creators, bootable creator skill."
---

# Creator Meta

The portable substrate behind every creator-specific operating system. Defines the 6-layer model, the "where does X go?" decision tree, and the brand-discipline framework — abstractly, with placeholders, so any creator can inherit and specialize.

`creator-meta` is to creator operating systems what `arcanea-meta` is to Arcanea or `frankx-meta` is to FrankX: the self-describing layer that makes the system bootable.

## When to use this skill

- Designing a new creator's Claude Code project structure (any creator, not just Frank)
- Asking "where should this live?" in any creator-tooling context
- Booting a fresh creator project with the proven layer model
- Comparing two creator setups for drift or convention divergence
- Generalizing a project-scope skill (like `frankx-meta`) into a portable plugin
- Reasoning about creator-tooling architecture independent of specific paths or brand

## When NOT to use this skill

- When you have a specific creator-meta child available (e.g., `frankx-meta`) — use that instead, it has concrete paths
- For domain work (writing code, content, music) — use the domain-specific skill
- For ACOS-internal questions — use `acos-meta` instead

## The 6-layer model (abstract)

```
L0  RAW INTAKE          {creator}/intake/                    inbound, unprocessed
L1  SECOND BRAIN        {creator}/docs/                      long-form prose
L2  COMMAND CENTER      {creator}/.claude/                   skills, commands, agents, hooks
L3  OPERATIONAL DATA    {creator}/{data,content,lib,scripts}/   typed records, MDX, code
L4  PUBLIC FACE         {creator}/{app,site,public}/         what the world sees
L5  SUBSTRATE           sibling repos                        open-source frameworks for forking
```

**The walk:** when you have a new artifact, walk top-to-bottom. Stop at the first layer that fits. If two fit, you're misreading the artifact — re-read and re-walk.

## Concrete instances

| Creator | Project skill | Repo | Specializations |
|---|---|---|---|
| Frank Riemer | `frankx-meta` | `~/frankx/` | L1=docs/, L4=app/, brand-walls Arcanean mythology, dual-repo deploy |
| _(scaffold)_ | `<name>-meta` | `~/<name>/` | Custom paths, custom brand, custom substrate repos |

This skill is the parent. Each child specializes paths, voice, and substrate boundaries while preserving the layer-model contract.

## The 5 meta-rules (creator-agnostic)

### 1. Layer before content
Before adding anything, decide which layer it belongs to. Skip-the-tree shortcuts cause sprawl.

### 2. Canonical wins
When two copies of the same data exist, the canonical (per the project's `canonical-locations.md`) is truth. Drift gets reconciled, never silently edited in both places.

### 3. Brand boundary is a wall, not a guideline
Each creator brand stays in its repo. Substrate brands (open-source frameworks) keep their own voice in their own repos but adopt the consuming creator's voice when surfaced. Brand walls are tested by automated grep on every PR.

### 4. Substrate is its own repo
L5 systems (open-source frameworks) live in their own GitHub repos with their own license and brand. The creator's main repo references them but never contains their source.

### 5. Production sync is human-gated
No tool ever auto-syncs from dev → production. Humans review diffs.

## The decision tree (abstract)

```
Q1: Is it inbound and unprocessed (chat, dump, voice memo, screenshot)?
    → L0 — drop in {creator}/intake/

Q2: Is it long-form prose that informs decisions?
    → L1 — {creator}/docs/{topic-or-date-folder}/

Q3: Is it Claude harness tooling (skill / command / agent / hook)?
    → L2 — global if reusable, project if creator-specific

Q4: Is it typed data, MDX content, library code, or build script?
    → L3 — {creator}/{data,content,lib,scripts}/

Q5: Does it ship as a page / component / static asset?
    → L4 — {creator}/{app,site,public}/

Q6: Is it a foundational framework for others to fork?
    → L5 — new sibling repo with MIT, dedicated brand, own SKILL.md
```

Full decision-tree depth: `references/decision-tree.md`.

## How to specialize (boot a new creator)

```
1. Create skill folder:    ~/<creator>/.claude/skills/<creator>-meta/
2. Copy skeleton:          cp -r ~/.claude/skills/creator-meta/_template/ ./
3. Specialize SKILL.md:
   - Replace {creator} placeholders with concrete paths
   - Define your brand voice + lexicon walls
   - List your sibling substrate repos (Tier 2)
4. Create references/canonical-locations.md with your real paths
5. Create references/ecosystem-inventory.md with your shipped systems
6. Create references/brand-discipline.md with your voice rules
7. Test: invoke trigger phrase "where does X go" — verify activation
```

A `_template/` example is bundled in `references/template-creator-meta.md`.

## Composition with ACOS

`creator-meta` is what ACOS v11's `compose.extends` declares. ACOS plugin manifest (`~/agentic-creator-os/.claude-plugin/plugin.json`) inherits this substrate. Any creator who installs ACOS automatically gets the layer model + decision tree, then specializes via their own `<creator>-meta` project skill.

```
ACOS v11 plugin
   └── compose.extends = ["creator-meta"]
        └── creator-meta (this skill, global)
             └── inherited & specialized by <creator>-meta (project)
```

## What this skill does NOT specify

- Specific paths (those are creator-specific)
- Specific brand voice (that's per-creator)
- Specific substrate repos (those are per-creator)
- Specific tooling versions (those are per-creator)
- Specific publishing targets (those are per-creator)

If a question requires those answers, drop down to the creator's project skill (e.g., `frankx-meta`).

## Anti-patterns

- **Adding creator-specific names to this skill** — defeats the abstraction
- **Defining substrate repos in the abstract** — substrates are per-creator
- **Making this skill mandatory** — it's a base class, not a runtime requirement
- **Forking this skill instead of inheriting** — duplication causes drift; specialize via a child skill
- **Skipping the decision tree** — that's the load-bearing piece

## Related skills

- `acos-meta` — describes ACOS v11 specifically (the plugin that composes on this substrate)
- `arcanea-meta` — the same pattern applied to Arcanea (mythology + tooling)
- `frankx-meta` — the FrankX-specific child of this skill
- `superpowers:writing-skills` — how to write a new skill following this pattern

## References

- `references/decision-tree.md` — full Q1-Q6 walk with edge cases (abstract)
- `references/template-creator-meta.md` — paste-able template for booting a new creator
- `references/brand-discipline-framework.md` — voice-rule framework (creator-agnostic)
- `references/composition-with-acos.md` — how creator-meta plugs into ACOS v11
