---
name: partner-anthropic
description: Anthropic intelligence — Claude model family, Claude Code, MCP protocol, Claude for Work programs, May 2026 state, Frank's relationship state, integration patterns. Use when generating Anthropic content, writing about Claude/MCP/Claude Code, partnership-conversation prep for Anthropic, or evaluating new Anthropic releases.
---

# Anthropic — Partner Intelligence

## Current state (as of 2026-05-17)
The Claude 4 family is the current shipping line — Opus 4.7 at the top (extended thinking + 1M context), Sonnet 4.6 in the middle, Haiku 4.5 at the bottom (to verify exact release dates beyond Frank's Jan 2026 knowledge cutoff). Claude Code is now a first-class CLI with SDK bindings and a stable skill format. The Model Context Protocol (MCP) — owned and stewarded by Anthropic — has graduated from spec to ecosystem standard, with first-party tooling from Vercel, Cursor, and Codex consuming the same wire format. Claude for Work and Claude for Enterprise tiers continue to anchor the commercial lane.

## Product map
- **Claude (model family)** — Opus 4.7 (reasoning + 1M context), Sonnet 4.6 (balanced), Haiku 4.5 (fast). Frank works against Opus 4.7 by default.
- **Claude Code (CLI + SDK)** — the agentic build harness. Stable skills/agents/commands/hooks format. The harness underneath every shipped FrankX repo.
- **Claude API** — direct API access via `@anthropic-ai/sdk` (TS) and `anthropic` (Python). Prompt caching, tool use, vision, batch, files, citations, memory.
- **Claude Agent SDK** — managed-agent framework for long-running autonomous loops. Sibling lane to Vercel AI SDK (web) and Google ADK (enterprise) in the Starlight three-lane portfolio.
- **Claude for Work** — team tier with shared chats, projects, and admin controls.
- **Claude for Enterprise** — SSO, audit, data residency, expanded context, enterprise procurement.
- **Model Context Protocol (MCP)** — open spec owned by Anthropic. Servers expose tools/resources/prompts over stdio or HTTP. Frank ships SIS as a 31-tool MCP server.
- **Claude Code skills marketplace** — community + first-party skills (`vercel:*`, `code-review:*`, `superpowers:*`, `agent-sdk-dev:*`, etc.).
- **Open-source artifacts** — `@anthropic-ai/sdk` (MIT), `claude-code` (proprietary CLI, MIT skills), MCP reference servers and SDKs (MIT).

## Pricing tiers (May 2026, to verify against current pricing page)
- **Free (Claude.ai)** — Sonnet access, daily message limit.
- **Pro** — $20/mo individual. Higher limits, Opus access, Projects.
- **Max** — $100-200/mo tier (to verify) for heavy Opus users + Claude Code.
- **Team** — $25-30/seat/mo (to verify), 5-seat minimum, shared Projects.
- **Enterprise** — contact sales. SSO, audit, data residency, expanded context window, custom retention.
- **API** — pay-per-token. Opus 4.7 ~$15/$75 per million input/output (to verify). Prompt caching cuts repeat-prompt cost 90%. Batch API 50% discount.

## Programs Frank is pursuing
- **Claude for Work Partner Program** — application pathway open. Entry criteria: demonstrated Claude-native body of work, measurable customer footprint, ability to deliver attribution-aligned content. Frank's qualifier: four public Claude-Code-native repos (ACOS, SIS, Library OS, AI Architect Academy) + Build First AI Agent workshop Claude branch + 7,000-strong EMEA architect audience. Value to Frank: formal attribution lane + workshop credits + co-marketing visibility.
- **MCP ecosystem alignment** — informal. SIS contributes a reference 31-tool MCP server including Oracle Autonomous Database connectivity. Active feedback loop with the MCP spec from daily delivery use.

## Frank's working stack with Anthropic
- **Claude Code** — daily build harness. Every commit on `frankxai/FrankX`, `frankxai/frankx.ai-vercel-website`, `frankxai/agentic-creator-os`, `frankxai/starlight-intelligence-system`, `frankxai/library-os`, `frankxai/ai-architect-academy`, `oci-ai-architects/claude-code-oci-ai-architect-skills` runs through it.
- **Opus 4.7 (1M context)** — default model for Frank's sessions (per current model card).
- **Claude API** — used in production for the Studio L2/L3 producer pipeline, IIS multi-agent decision-support, and Library OS book-distiller subagent.
- **MCP servers consumed daily** — `memory-bus`, `sis`, `cockpit`, plus partner MCPs (Vercel, Linear, Notion, Figma, Slack, etc.).
- **Claude Agent SDK** — reasoning lane in Starlight Agent Lab three-lane portfolio.

## Frank's audience funnel touching Anthropic
- **LinkedIn (~7,000 EMEA architects)** — recurring posts on Claude Code patterns, agent-native CoE methodology, MCP architecture. 100+ engagement floor on Claude-native topics without paid amplification.
- **Workshop touchpoint** — Build First AI Agent workshop Claude branch (the strongest-landing branch in EMEA cohorts). Live at `/workshops/build-first-ai-agent`.
- **Public content surfaces** — `/research`, `/blog` Field Notes, `/os` modules, `/ai-coe`, `/ai-architect-academy`, `/library/approach`, `/intelligence-system` (IIS).
- **Public reference implementations** — ACOS, SIS, Library OS, OCI Claude Code skill pack — all four open and Claude-Code-native.

## Integration patterns Frank ships
1. **Claude Code skills format (SKILL.md)** — YAML frontmatter + structured markdown body. Triggered by filename match or explicit invocation. Pattern lives in `~/.claude/skills/<name>/SKILL.md`.
2. **MCP server pattern (TypeScript)** — stdio or HTTP transport, tools/resources/prompts surface, OAuth flow for HTTP servers. Reference: SIS 31-tool server with Oracle Autonomous Database connectivity.
3. **Subagent dispatch (Task tool)** — long-running parallel work, separate context, explicit instructions, single message return. Used in `/library-deepen`, `/visual-strategy`, IIS multi-agent.
4. **Prompt caching at scale** — system prompts + tool definitions cached, only delta sent per turn. Cuts cost 90% on repeat-context flows like the Studio producer pipeline.
5. **Claude Agent SDK loop** — managed autonomous agent with memory + tool use + checkpointing. Used for long-running ops in Starlight reasoning lane.

## Things to watch (May 2026 → next 90 days)
- **Claude 5 family** — next-gen model line rumored for mid-2026 (to verify). Will reset the Opus/Sonnet/Haiku ceiling.
- **Claude Code skills marketplace maturation** — discoverability + versioning + dependencies are the next surface to harden.
- **MCP HTTP transport adoption** — stdio is solved; HTTP + OAuth is the enterprise lane. Track Anthropic's reference HTTP server SDK.
- **Claude Agent SDK GA** — pricing + SLA + memory durability are open questions.
- **Claude for Work partner mechanics** — attribution slots, co-marketing surfaces, attendee credits — the program shape is still settling.

## Voice rules when writing about Anthropic
- Verifiable claims only — every product/pricing fact resolves to a public URL or is marked "to verify".
- Never "official Anthropic partner" without the program qualifier ("pursuing Claude for Work Partner Program").
- Never claim formal partnership, revenue share, or co-marketing arrangement that does not exist.
- Honor `partner-anthropic` namespace pattern in all references.
- Peer-architect voice — Frank is operator-side (Oracle EMEA AI Architect), not Anthropic-employee-flavored.
- No emojis, no AI-tone words (delve, dive into, transform, revolutionize, accelerate, journey, unleash, unlock, empower).

## Cross-references
- Public partnership page: https://www.frankx.ai/partnerships/anthropic
- Outreach packet: `docs/private/outreach/2026-05-14-partnerships-send-ready.md`
- Private brief: `.frankx/private/partnerships/anthropic-brief.md` (gitignored)
- Public skill: `~/.claude/skills/partner-anthropic/SKILL.md` (this file)
- Specialist agent: `~/.claude/agents/partner-anthropic.md` (separate)
- Working repos: `frankxai/agentic-creator-os`, `frankxai/starlight-intelligence-system`, `frankxai/library-os`, `frankxai/ai-architect-academy`, `oci-ai-architects/claude-code-oci-ai-architect-skills`
- Frank's stake: Every shipped FrankX project runs in Claude Code. The Claude branch of Build First AI Agent is the strongest-landing branch in EMEA cohorts. Claude for Work Partner Program is the formal lane being pursued.
