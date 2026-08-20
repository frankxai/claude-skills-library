# Multi-Runtime Support

> Skills in this library are authored in **Claude Code's SKILL.md format** (Markdown + YAML frontmatter), but the underlying capabilities are portable across all major agentic CLIs.
> This document maps the import path per runtime.

**Status:** Documentation v0.1 (2026-05-27). Implementation-level adapters are runtime-specific and shipped per skill where applicable.

---

## TL;DR matrix

| Runtime | Native skill format | Import path for this library | Status |
|---|---|---|---|
| **Claude Code** | `.claude/skills/<name>/SKILL.md` (Markdown + YAML) | Drop or symlink `free-skills/<name>/` into `~/.claude/skills/` | ✅ Native |
| **Antigravity** | Reads project `.antigravity/instructions.md` + `.arcanea/ops/*` | Point AG at the project that consumes the skill | ✅ Substrate-compatible |
| **Codex CLI** | TOML config + MCP tool integration | Skills become MCP tools via a thin wrapper; or pasted into `~/.codex/AGENTS.md` | 🟡 Per-skill MCP wrap |
| **Gemini CLI** | `settings.json` + chat templates | Use as system-prompt content via `gemini --system` flag, or wrap as ADK agent | 🟡 Per-skill template |
| **OpenCode** | `.opencode/skills/<name>.md` | Existing adapter pattern at `agentic-creator-os/adapters/opencode/` | ✅ Existing adapter |
| **Cursor** | `.cursor/rules/*.mdc` or `.cursorrules` | Convert SKILL.md frontmatter to `.mdc` rule | 🟡 Per-skill convert |

**Key insight:** Claude Code's SKILL.md format is the closest thing to a *universal skill primitive* in the May-2026 agentic landscape — it's Markdown + YAML, so any LLM can consume it. The "import" differences are mostly about *where the file lives* and *how the runtime discovers it*.

---

## Universal protocol: MCP

For the runtimes that don't natively read `SKILL.md` files (Codex, Gemini CLI, parts of Antigravity), the canonical bridge is **Model Context Protocol (MCP)**.

- All four runtimes support MCP servers (Claude Code, Codex, Gemini CLI/AG via Vertex, Cursor).
- A skill can be wrapped as an MCP tool by exposing its functionality via stdio MCP server.
- See the per-runtime guides in [`runtimes/`](./runtimes/) for the canonical wrapper pattern.

When MCP is wired, the skill is callable from any MCP-aware runtime with identical semantics. This is the long-term direction.

---

## Per-runtime import guides

See [`runtimes/README.md`](./runtimes/README.md) for the index.

- [`runtimes/claude-code.md`](./runtimes/claude-code.md)
- [`runtimes/codex.md`](./runtimes/codex.md)
- [`runtimes/gemini-cli.md`](./runtimes/gemini-cli.md)
- [`runtimes/antigravity.md`](./runtimes/antigravity.md)
- [`runtimes/cursor.md`](./runtimes/cursor.md)
- [`runtimes/opencode.md`](./runtimes/opencode.md)

---

## Authoring guidance

When you add a new skill to `free-skills/`:

1. **Write SKILL.md in Claude Code format** (Markdown + YAML frontmatter — this is the canonical source).
2. **Test in Claude Code first** — fastest feedback loop.
3. **Document any runtime-specific gotchas** in the skill's own README (e.g., "this skill assumes WebSearch tool — Codex needs the `web-search` MCP server installed").
4. **Optional:** ship an MCP wrapper in `wrappers/<skill-name>/` if the skill benefits from cross-runtime portability.

---

## Why Markdown-first

Markdown skills are:
- **Diffable** — every change shows in PRs
- **Human-readable** — no proprietary format lock-in
- **LLM-native** — every modern LLM speaks Markdown
- **Portable** — copy-paste works in any chat interface as a fallback

The runtime-specific wrappers exist to make installation seamless, not because the skill content needs to differ. The same SKILL.md works in Claude Code, in a ChatGPT system prompt, in a Gemini instruction file, or pasted into a Cursor `.mdc` rule.

---

*Authored 2026-05-27 during the L99 multi-runtime audit. Implementation-level adapter shims (Codex MCP wrapper template, Gemini ADK template, AG runtime hook template) are tracked as follow-ups in the [issues](https://github.com/frankxai/claude-skills-library/issues) tab.*
