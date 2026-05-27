# Multi-Runtime Import Guides

Each file in this directory documents how to import skills from `free-skills/` into a specific agentic runtime.

| Runtime | Maturity | File |
|---|---|---|
| Claude Code | ✅ Native | [`claude-code.md`](./claude-code.md) |
| Antigravity (`agy`) | ✅ Substrate-compatible | [`antigravity.md`](./antigravity.md) |
| Codex CLI | 🟡 Per-skill MCP wrap | [`codex.md`](./codex.md) |
| Gemini CLI | 🟡 Per-skill template | [`gemini-cli.md`](./gemini-cli.md) |
| OpenCode | ✅ Existing adapter pattern | [`opencode.md`](./opencode.md) |
| Cursor | 🟡 Per-skill convert | [`cursor.md`](./cursor.md) |

See top-level [`MULTI_RUNTIME.md`](../MULTI_RUNTIME.md) for the overview and the universal-MCP rationale.

---

## Quick-start summary

**Claude Code (most native):**
```bash
git clone https://github.com/frankxai/claude-skills-library ~/skills-library
cp -r ~/skills-library/free-skills/<skill>/ ~/.claude/skills/
# Restart Claude Code session, skill auto-discovered
```

**Antigravity / `agy`:**
```bash
# Skills are consumed via the project's .antigravity/instructions.md → .arcanea/ops/ chain
# Point AG at any Arcanea-pattern project and the skills compose automatically
```

**Codex:**
```bash
# Option A: paste SKILL.md content into ~/.codex/AGENTS.md as a section
# Option B: wrap the skill as an MCP server (see ../wrappers/<skill> if present)
```

**Gemini CLI:**
```bash
gemini --system "$(cat free-skills/<skill>/SKILL.md)"
# Or paste content into ~/.gemini/GEMINI.md
```

**OpenCode:**
```bash
# See agentic-creator-os/adapters/opencode/ for the existing adapter pattern
```

**Cursor:**
```bash
# Convert SKILL.md frontmatter to .mdc rule format
# Drop in .cursor/rules/<skill>.mdc
```
