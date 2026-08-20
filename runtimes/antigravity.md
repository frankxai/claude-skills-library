# Importing skills into Antigravity (`agy`)

Antigravity is Google's agentic IDE (released late 2025, GA 2026). The `agy` CLI is its terminal-side companion. Antigravity reads:

1. **`.antigravity/instructions.md`** in the project root
2. **`.arcanea/ops/*`** for shared commands (Arcanea pattern)
3. **`AGENTS.md`** for cross-runtime agent instructions

## Option A — Substrate-based (Arcanea pattern, recommended)

The Arcanea ecosystem uses a **substrate-first** approach: skills, agents, and commands live in `.arcanea/ops/` and `.arcanea/agents/`, and `.antigravity/instructions.md` points to them.

To import a skill this way:

```bash
SKILL=acos-visual-gen

# Drop the skill into the project's .arcanea/ops/ directory
mkdir -p .arcanea/ops/skills/$SKILL
cp -r ~/skills-library/free-skills/$SKILL/* .arcanea/ops/skills/$SKILL/

# Confirm .antigravity/instructions.md references the substrate
cat .antigravity/instructions.md | grep -q "arcanea/ops"
```

If the file already has `Read .arcanea/ops/AGENT_BOOTSTRAP.md first.`, the skill is now part of the substrate.

## Option B — Direct AGENTS.md

For a non-Arcanea project:

```bash
cat ~/skills-library/free-skills/<skill>/SKILL.md >> AGENTS.md
```

Antigravity reads `AGENTS.md` on session start.

## Option C — Global `~/.gemini/antigravity/` config

For skills available across all AG projects:

```bash
mkdir -p ~/.gemini/antigravity/skills/<skill>
cp -r ~/skills-library/free-skills/<skill>/* ~/.gemini/antigravity/skills/<skill>/

# Then reference in your global instructions
```

## What AG does well with skills

- **Multi-model parallel:** AG runs Gemini 3 Pro + Claude Sonnet 4.6 side-by-side. Skills that benefit from comparing outputs (refactoring, summarization, A/B prompts) shine here.
- **Browser pane:** AG has a built-in browser. Skills that need web fetch + screenshot work natively.
- **Vercel-native deploy:** Skills that touch deploy state can use AG's native Vercel integration.

## Cached-belief validation in AG

Per `~/Arcanea/.antigravity/instructions.md`, AG sessions must follow the same disk-verification rules as Claude Code:

> "Any claim about CURRENT state (versions, ship status, file paths, deploys, test results) requires same-turn disk verification (Read/Bash) OR explicit prefix: 'unverified, from [memory|prior-turn] (date X):'."

This applies to skill execution too — when a skill claims "X is shipped", AG must verify before acting on it.

## Multi-CLI alignment

AG is one of 5 tools on Frank's substrate (Claude Code, Codex, AG, OpenCode, Cursor). All five read the same Arcanea substrate (`.arcanea/CLAUDE.md`, `MEMORY.md`, root `CLAUDE.md`). The substrate is the alignment, not the CLI — so skills imported via the substrate pattern (Option A) work uniformly across all five.

## Verifying

```bash
agy
> "Use <skill description trigger> for this task"
```

Confirm AG references the skill's instructions in its reasoning.
