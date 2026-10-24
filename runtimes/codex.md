# Importing skills into Codex CLI

> **Verified 2026-10-24 with codex-cli 0.164.0:** Codex installs Agent Skills straight from this repo's
> plugin marketplace. No AGENTS.md pasting is needed.
>
> ```bash
> codex plugin marketplace add frankxai/claude-skills-library
> codex plugin add frankx-skills@claude-skills-library   # the full library (renamed from claude-skills-library on 2026-10-24)
> ```
>
> The 10-skill `skills-with-evals` pack is on a release-candidate branch until merged; pin it with `@`:
> `codex plugin marketplace add frankxai/claude-skills-library@agent/hyperagent/eval-pack-rc1`, then
> `codex plugin add skills-with-evals@claude-skills-library`.
>
> `codex debug prompt-input "hello"` then lists each skill as `<plugin>:<skill>: <description>`. The list has
> a fixed budget shared by every installed skill: descriptions show in full on small installs and are trimmed
> evenly on large ones (about 104 characters with all 114 library skills installed). Put the "use when" cue
> early; `node scripts/trigger-lint.mjs` flags cues after character 100. Measurements:
> `products/skills-with-evals/receipts/codex-skill-list-budget.md`. The options below
> are the older fallback for Codex versions without plugin marketplaces.


Codex CLI (OpenAI's coding agent) doesn't have a file-based skill discovery system like Claude Code. Integration is via:

1. **`AGENTS.md` in the project** — Codex reads this on session start
2. **MCP tools** — Codex supports MCP servers, can call skills wrapped as MCP

## Option A — Paste-style (fastest, no infra)

Drop the skill's SKILL.md content into the project's `AGENTS.md` as a section:

```bash
SKILL=acos-visual-gen
echo "
## Skill: $SKILL
$(cat ~/skills-library/free-skills/$SKILL/SKILL.md | tail -n +5)
" >> ~/myproject/AGENTS.md
```

Codex will read this on next session and act on the skill's instructions when the description's trigger conditions match.

**Pro:** Zero infra. Just text in AGENTS.md.
**Con:** Each project needs the skill duplicated. Doesn't scale to many skills.

## Option B — Global Codex AGENTS.md

For skills you want available everywhere:

```bash
cat ~/skills-library/free-skills/<skill>/SKILL.md >> ~/.codex/AGENTS.md
```

Codex sees `~/.codex/AGENTS.md` on every session.

## Option C — MCP wrapper (recommended for production)

Wrap the skill as an MCP tool so it's callable from any MCP-aware runtime:

```bash
# Use the MCP wrapper template at ../wrappers/mcp-template/
cp -r ~/skills-library/wrappers/mcp-template/ ~/.codex/mcp-servers/<skill>
# Edit <skill>/server.py to invoke the skill's logic
```

Then register the MCP server in Codex's config:

```bash
# ~/.codex/config.toml
[mcp]
servers = ["~/.codex/mcp-servers/<skill>/server.py"]
```

**Pro:** Skill is callable as a tool, not just instructions. Composable with other tools.
**Con:** Requires wrapping the skill logic in Python/Node MCP server code.

## What works well in Codex

- Skills that are **instruction-style** (Markdown rules Codex follows when prompted)
- Skills that **call existing tools** Codex already has (shell, file ops, web search)

## What doesn't translate cleanly

- Skills that depend on **Claude Code-specific tools** (TaskCreate, Skill tool, etc.) — Codex has analogues but different names
- Skills that require **specific MCP servers** not yet installed in Codex — install those first

## Verifying

```bash
codex
> "Use the <skill> approach for this task"
```

If Codex follows the skill's instructions, import is working.
