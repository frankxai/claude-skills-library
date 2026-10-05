<p align="center"><img src=".github/assets/hero.svg" width="100%" alt="Three original skill mascots for build, design, and connect" /></p>

# Claude Skills Library

### 115 Agent Skills for Claude Code and other skills-aware runtimes

Practical `SKILL.md` workflows for building agent systems, designing interfaces, connecting MCP tools, reviewing code, and creating media. Start with one skill for the job at hand; the [full catalog](docs/CATALOG.md) is available when you need more.

[![Skills](https://img.shields.io/badge/skills-115-blue.svg)](docs/CATALOG.md) [![License](https://img.shields.io/badge/license-MIT%20%2B%20upstream%20terms-555.svg)](THIRD_PARTY_NOTICES.md) [![Validation](https://img.shields.io/badge/frontmatter-validated-success.svg)](scripts/validate_skills.py)

[Get started](#get-started) · [Pick a skill](#pick-a-skill) · [How the pieces fit](#how-the-pieces-fit) · [Sources and standards](docs/ECOSYSTEM.md) · [Contribute](CONTRIBUTING.md)

> This is an independent FrankX catalog. It is not an Anthropic or OpenClaw product. Original contributions use the [MIT license](LICENSE); imported skills retain their own [upstream terms](THIRD_PARTY_NOTICES.md).

## Get started

Install the catalog as a Claude Code plugin:

```text
/plugin marketplace add frankxai/claude-skills-library
/plugin install claude-skills-library@claude-skills-library
```

Or copy only the skill you need:

```bash
git clone https://github.com/frankxai/claude-skills-library.git
mkdir -p ~/.claude/skills
cp -r claude-skills-library/free-skills/mcp-architecture ~/.claude/skills/
```

For a nested skill, copy the folder that directly contains its `SKILL.md`. Claude Code can select relevant skills or you can invoke one by name. Other runtimes need their own discovery path; see the [runtime guides](runtimes/) before installing. Plugin and skill updates depend on the installation method; check your plugin manager for available updates.

## Pick a skill

| Your job | Start here | What it helps you do |
| --- | --- | --- |
| Design an agent system | [Agent design review](free-skills/agent-design-review/SKILL.md) | Test failure paths, context, integrations, and cost before implementation. |
| Connect tools | [MCP architecture](free-skills/mcp-architecture/SKILL.md) | Choose tool, resource, and prompt boundaries with authentication and failure handling. |
| Build a web app | [Next.js expert](free-skills/nextjs-expert/SKILL.md) | Work through App Router boundaries and production concerns. |
| Review code | [GitHub code review](free-skills/github-code-review/SKILL.md) | Turn a diff into specific correctness and security findings. |
| Improve design | [UI/UX design expert](free-skills/ui-ux-design-expert/SKILL.md) | Review layout, interaction, and accessibility. |
| Plan agent workflows | [Agentic orchestration](free-skills/agentic-orchestration/SKILL.md) | Define ownership, handoffs, and recovery for multi-step work. |
| Manage model context | [Memory prune](free-skills/memory-prune/SKILL.md) | Remove stale context while retaining decisions that matter. |
| Diagnose an agent workflow | [Performance analysis](free-skills/performance-analysis/SKILL.md) | Inspect task timing and coordination bottlenecks in a Claude Flow workflow. |

**115 skills** across engineering, MCP, design, content, and specialist domains. The [generated catalog](docs/CATALOG.md) lists every skill and its description. Specialist Oracle skills remain there for people who need them; they do not define the library's direction.

For focused packs, see [FrankX skills](https://github.com/frankxai/skills) for AI architecture and [Creator Skills](https://github.com/frankxai/creator-skills) for creative workflows. The [source and review map](docs/ECOSYSTEM.md) links to more of the FrankX estate and to official and community skills. A link is a discovery route, not a claim that the source is bundled or endorsed here.

For local machine readiness, see the [FrankX Peak Performance source skill](https://github.com/frankxai/claude-code-config/blob/main/skills/pp/SKILL.md). It depends on a machine-specific package and is not bundled here.

## How the pieces fit

| File or service | Job | When it loads |
| --- | --- | --- |
| `SKILL.md` | A reusable procedure with optional scripts and references | When the runtime selects or invokes the skill |
| `CLAUDE.md` or `AGENTS.md` | Standing repository instructions | According to the runtime's own instruction discovery rules |
| MCP server | Authenticated access to tools or external data | When configured and connected |
| Test or eval | Evidence that a procedure or implementation behaves as intended | When run |

A skill can teach an agent **when and how** to use an MCP tool; it does not supply the connection, credentials, or permissions. Repository instructions should point to the right workflows without copying whole skill bodies. Read the [current conventions and source links](docs/ECOSYSTEM.md) for runtime differences.

## Make and check a skill

Each skill is a folder with `SKILL.md` and optional `references/`, `scripts/`, or `assets/`. Start from the [template](template/SKILL.md) and [authoring standard](spec/README.md). Give it a narrow job, a description that says when to use it, observable steps, and at least one real use case. Keep examples and executable code accurate; frontmatter validation alone does not establish behavior or safety.

```bash
python scripts/validate_skills.py
python scripts/generate_catalog.py --check
python scripts/generate_site.py --check
python scripts/check_links.py
python scripts/check_counts.py
```

These checks run in [CI](.github/workflows/validate.yml). Read [CONTRIBUTING.md](CONTRIBUTING.md) for the import and review path. External skills should be linked until their license, provenance, portability, commands, and actual outputs have been reviewed.

## FAQ

**Does loading 115 skills bloat my context?** A skills-aware runtime normally discovers metadata first and reads a skill body when invoked or selected. Exact discovery and context costs vary by runtime and configuration; install a focused pack if you want a smaller menu. See [Claude Code's current skill behavior](https://code.claude.com/docs/en/skills).

**Are all skills equally reviewed?** No. The catalog checks structure and links. It does not prove every workflow's accuracy against current APIs or evaluate its output. The [ecosystem guide](docs/ECOSYSTEM.md) distinguishes bundled, linked, and candidates for deeper review.

**Can I use this outside Claude Code?** Many skills use the open `SKILL.md` format. Claude-specific fields and tool instructions may need adaptation. Start with the [runtime guides](runtimes/).

## Community and license

[Ask a question](https://github.com/frankxai/claude-skills-library/discussions/categories/q-a), [request a skill](https://github.com/frankxai/claude-skills-library/issues/new/choose), or [contribute a fix](CONTRIBUTING.md). Keep credentials and private material out of public examples; use [private vulnerability reporting](SECURITY.md) for security issues.

Would reproducible skill evals help you choose what to install? [Tell us which skill and failure case matter](https://github.com/frankxai/claude-skills-library/discussions/new?category=ideas&title=Skills%20with%20evals). This feedback informs the open [README capture work](https://github.com/frankxai/claude-skills-library/issues/41).

The repository's original work is [MIT licensed](LICENSE). Check [third-party notices](THIRD_PARTY_NOTICES.md) and nested license files for imported material.
