# Template — Booting a New `<creator>-meta` Skill

_Paste-able template for any creator who wants to inherit `creator-meta` and specialize. Replace `<creator>` and `<Creator>` everywhere with your actual name._

## Step 1 — Create the directory

```bash
mkdir -p ~/<creator>/.claude/skills/<creator>-meta/references
```

## Step 2 — Create the SKILL.md

Path: `~/<creator>/.claude/skills/<creator>-meta/SKILL.md`

```markdown
---
name: <creator>-meta
description: "<Creator> ecosystem self-description — the system map for the <creator> repo and its sibling repos. Inherits creator-meta. Use when asked about the layer model, where things live, canonical locations, how to add a skill/command/agent/page/system, or what's installed. Trigger phrases: <creator> meta, <creator> system map, where does X live in <creator>, where does this go, layer model, <creator> ecosystem, what's installed in <creator>, <creator> canonical."
---

# <Creator> Meta

Inherits `creator-meta` (global). Specializes the abstract layer model with concrete paths, brand voice, and substrate boundaries for the <Creator> ecosystem.

## Mental model — the 6 layers (specialized)

```
L0  RAW INTAKE          .intake/                          (private)
L1  SECOND BRAIN        docs/                             (private, Obsidian vault)
L2  COMMAND CENTER      .claude/{skills,commands,agents,hooks}/
L3  OPERATIONAL DATA    data/, content/, lib/, scripts/   (private)
L4  PUBLIC FACE         app/, components/, public/        (deploys to <creator-domain>)
L5  SUBSTRATE           sibling repos (<list-them-here>)
```

Full abstract spec: `~/.claude/skills/creator-meta/SKILL.md`. This skill specializes it.

## Meta-rules (inherited from creator-meta + <creator>-specific)

1. **Layer before content** — walk the decision tree before adding anything new
2. **Canonical wins** — when two copies drift, the canonical (per `references/canonical-locations.md`) is truth
3. **Brand boundary is a wall** — <Creator> brand voice = "<your-tagline>". <Specific-substrate> stays in its own repo.
4. **Substrate is its own repo** — L5 systems own their license + brand
5. **Production sync is human-gated** — no auto-sync from dev → production

## Quick-reference canonicals

| Concern | Canonical | Why |
|---|---|---|
| Layer model | `~/.claude/skills/creator-meta/SKILL.md` (parent) + this skill | Inheritance chain |
| Project skills | `.claude/skills/{name}/SKILL.md` (project) + `~/.claude/skills/{name}/` (global) | Scope rule |
| Memory | `~/.claude/projects/.../memory/MEMORY.md` | Auto-loaded every turn |
| Production deploy | `<your-production-repo>` | Human-gated |

Full table: `references/canonical-locations.md`.

## Scope rule

When adding a skill/command/agent/hook:
- Reusable across ALL your repos → global at `~/.claude/`
- <Creator>-specific → project at `.claude/`
- Never both

## How to add (per layer)

| To add… | Walk to… |
|---|---|
| New chat export, drop, brain dump | L0 — `.intake/` |
| New plan, spec, audit, brand doc | L1 — `docs/{topic-or-date-folder}/` |
| New skill / command / agent / hook | L2 — scope decision then `.claude/` or `~/.claude/` |
| New typed registry, MDX article, library function, script | L3 — `data/`, `content/`, `lib/`, `scripts/` |
| New page, component, image | L4 — `app/`, `components/`, `public/` |
| New foundational framework for forking | L5 — new sibling repo, MIT, dedicated brand |

## When this skill activates

- "Where does X go?" / "Where should I add Y?"
- "What's the <creator> system map?"
- "How do I add a skill/command/agent/page/system to <creator>?"
- "What's the layer model?"
- Onboarding a new Claude session to <creator>

## References

- `references/canonical-locations.md` — full table of canonical paths per concern
- `references/ecosystem-inventory.md` — every shipped system in <creator>
- `references/decision-tree.md` — Q1-Q6 walk specialized for <creator>
- `references/brand-discipline.md` — voice rules + boundaries

## Inherits from

- `~/.claude/skills/creator-meta/` — abstract substrate (the parent)
- `~/.claude/skills/acos-meta/` — if you've installed ACOS

## Version

v1.0.0 — generated from creator-meta template on YYYY-MM-DD.
```

## Step 3 — Create the references files

For each `references/{file}.md`, copy the abstract version from `~/.claude/skills/creator-meta/references/` and specialize the placeholders. The structure is:

- `canonical-locations.md` — fill in your real paths
- `ecosystem-inventory.md` — list your shipped systems
- `decision-tree.md` — copy from parent, swap `{creator}` for your name
- `brand-discipline.md` — your voice rules + any substrate-brand walls

## Step 4 — Test the activation

In a Claude Code session inside your creator repo:

```
You: where does this article draft go?
Claude: <Should activate <creator>-meta and walk Q1-Q6>
```

If activation fails, check:
- Frontmatter `description` includes trigger phrases
- Skill is at correct path: `.claude/skills/<creator>-meta/SKILL.md`
- Trigger phrases match what you typed

## Step 5 — Update memory + onboarding

Add to your project `CLAUDE.md`:

```markdown
## Layer model

This project follows the layer model from `creator-meta`, specialized in `.claude/skills/<creator>-meta/`.

When asked "where does X go?" — the skill auto-loads.
```

## Anti-patterns when booting

- **Don't skip references** — `canonical-locations.md` is load-bearing for "where does X go?" questions
- **Don't forge inheritance** — reference creator-meta in your description, don't copy-paste it
- **Don't add everything at once** — start with SKILL.md + canonical-locations.md, add others as they earn their keep
- **Don't reuse another creator's brand voice** — your voice is yours, walls are walls

## Real-world example

`~/frankx/.claude/skills/frankx-meta/` is the FrankX-specific child of this template, shipped 2026-05-03 in F1 sprint. Read it for a working reference.
