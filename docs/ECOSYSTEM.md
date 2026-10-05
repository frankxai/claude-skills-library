# Sources, standards, and review status

Updated 2026-10-05. This page is a source map, not an endorsement or an installation manifest. The 115 folders in [this catalog](CATALOG.md) are bundled; links below point to separately maintained projects unless marked “imported.”

## Current conventions

| Concern | Primary source | Practical rule |
| --- | --- | --- |
| Portable skill format | [Agent Skills specification](https://agentskills.io/specification) | Put instructions in `SKILL.md` with valid frontmatter. Keep supporting files close and load them only when useful. |
| Claude Code behavior | [Claude Code skills](https://code.claude.com/docs/en/skills) | Verify which frontmatter fields are portable and which are Claude Code extensions. Check invocation and discovery in the target version. |
| Claude project memory | [Claude Code memory](https://code.claude.com/docs/en/memory) | Keep standing project facts in `CLAUDE.md`; move occasional procedures into skills. |
| Tool access | [MCP specification](https://modelcontextprotocol.io/specification) and [Claude Code MCP guide](https://code.claude.com/docs/en/mcp) | MCP supplies tools, resources, or prompts. A skill can describe their use but does not grant access. |
| OpenClaw skills | [OpenClaw skills guide](https://github.com/openclaw/openclaw/blob/main/docs/tools/skills.md) | Check its metadata, install location, requirements, and trust controls before adapting a skill. |
| ClawHub registry | [ClawHub guide](https://github.com/openclaw/clawhub/blob/main/docs/clawhub.md) | Inspect the exact version and source. A registry listing or scan is one input to review, not proof of quality. |

`AGENTS.md` and `CLAUDE.md` are runtime-specific instruction entry points. Do not assume one runtime reads the other's file or that they share precedence. A repository should state the standing rules once for its supported runtime and link to task-specific skills. If behavior must be enforced, use a checked command, test, or hook and verify that it actually runs.

## Sources worth reading

| Source | Status here | Best starting point |
| --- | --- | --- |
| [Anthropic skills](https://github.com/anthropics/skills) | Official upstream, linked; selected upstream examples already in `free-skills/anthropic/` retain their own license | [Skill creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) and [MCP builder](https://github.com/anthropics/skills/blob/main/skills/mcp-builder/SKILL.md) |
| [Vercel agent skills](https://vercel.com/docs/agent-resources/skills) | Official upstream, linked | React and Next.js performance, composition, and deployment workflows |
| [OpenClaw skills](https://github.com/openclaw/openclaw/blob/main/docs/tools/skills.md) | Official OpenClaw guidance, linked | Runtime metadata and installation conventions |
| [ClawHub](https://clawhub.ai) | Community registry, linked | Discovery only; inspect a specific listing before use |
| [FrankX skills](https://github.com/frankxai/skills) | FrankX source; `agent-design-review` imported on 2026-10-05 | MCP, context, agent design review |
| [FrankX Creator Skills](https://github.com/frankxai/creator-skills) | FrankX source, linked | Visual, music, and media workflows |
| [Awesome Design Agent Skills](https://github.com/frankxai/awesome-design-agent-skills) | FrankX source, linked | Design research and premium infographic workflows |
| [Starlight Agent Skills](https://github.com/frankxai/starlight-agent-skills) | FrankX source, linked | Review, research, and coding workflows |
| [FrankX Peak Performance](https://github.com/frankxai/claude-code-config/blob/main/skills/pp/SKILL.md) | Machine-bound source, linked; not portable or bundled | Local headroom, process pressure, and readiness |

The next import candidates are a portable `CLAUDE.md` / `AGENTS.md` maintenance skill, an official Vercel workflow, an MCP implementation review, and a local machine performance skill. Each needs a source revision, license check, sensitive-content review, working examples, and a behavior test before bundling. Machine performance guidance must measure headroom and avoid indiscriminate process termination.

## What “reviewed” should mean

1. **Provenance:** identify the exact upstream URL and revision; preserve license and notices. Never infer permission from a public GitHub page or a registry listing.
2. **Routing:** ask when the skill should and should not trigger. Test positive and negative prompts.
3. **Correctness:** run code and commands in a bounded test environment; check current official API docs, platform assumptions, error handling, and secret boundaries.
4. **Behavior:** compare the same realistic task with and without the skill. Inspect output, failures, recovery, time, and tool cost.
5. **Maintenance:** record the last reviewed revision and which claims need periodic refresh.

The repository CI currently checks frontmatter, generated catalog drift, counts, and internal links. It does **not** establish step 3 or 4 for every skill. This distinction should remain visible as the library grows.
