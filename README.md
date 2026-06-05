<div align="center">

# 🧠 Claude Skills Library

### 108 production-grade Agent Skills for Claude Code, Claude.ai & every major agentic runtime

> Turn your AI agent into a domain expert. Each skill is a self-contained, spec-compliant
> `SKILL.md` engineered with real frameworks, current best practices, and opinionated guidance —
> not 500 words of generic advice.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-108-blue.svg)](docs/CATALOG.md)
[![Spec compliant](https://img.shields.io/badge/frontmatter-validated-success.svg)](scripts/validate_skills.py)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**📚 Full Catalog**](docs/CATALOG.md) · [**⚡ Quick Start**](#-quick-start) · [**🌐 Multi-Runtime**](#-works-with-every-runtime) · [**🤝 Contributing**](CONTRIBUTING.md)

</div>

---

## 🚀 What is this?

A comprehensive, open-source library of **[Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)** —
the portable, model-invoked capability format introduced by Anthropic. Drop a skill into your agent
and it gains expert knowledge in a domain: it loads automatically when relevant and stays out of the
way when it isn't.

Every skill in this repo:

- ✅ Is a **self-contained folder** with a `SKILL.md` and optional `scripts/`, `references/`, and `examples/`.
- ✅ Has **spec-compliant frontmatter** (`name`, `description`, `version`) — verified by [`scripts/validate_skills.py`](scripts/validate_skills.py).
- ✅ Is **progressive-disclosure friendly**: a tight description for routing, deep guidance loaded only when invoked.
- ✅ Works across **Claude Code, Claude.ai, and 6+ other runtimes** (see [`runtimes/`](runtimes/)).

**108 skills** spanning AI agents, MCP, frontend, Oracle/cloud, content & creative production,
engineering workflow, and personal performance. **All free. MIT licensed.**

👉 **[Browse the complete, categorized catalog → `docs/CATALOG.md`](docs/CATALOG.md)**

---

## 🗂️ Skill categories

| Category | Count | Examples |
|---|---:|---|
| 🤖 **AI Agents & Orchestration** | 15 | `agentic-orchestration`, `swarm-orchestration`, `model-routing`, `reasoningbank-intelligence` |
| 🔌 **AI Frameworks, MCP & SDKs** | 13 | `mcp-architecture`, `mcp-builder`, `openai-agentkit`, `claude-sdk`, `langgraph-patterns` |
| ☁️ **Oracle & Cloud** | 7 | `oracle-ai-architect`, `oracle-database-expert`, `oci-services-expert`, `ai-architecture` |
| 🎨 **Web, Frontend & Animation** | 14 | `nextjs-expert`, `nextjs-react-expert`, `ui-ux-design-expert`, `tailwind`, `gsap`, `three` |
| 🛠️ **Engineering Workflow & GitHub** | 10 | `github-code-review`, `performance-analysis`, `verification-quality`, `hooks-automation` |
| ✍️ **Content, Writing & Brand** | 14 | `brand-voice`, `book-publishing`, `social-media-strategy`, `creator-productivity` |
| 🎬 **Creative & Media Production** | 22 | `suno-ai-mastery`, `video-production-workflow`, `hyperframes-media`, `higgsfield-soul-id` |
| 🧭 **Mind, Body & Philosophy** | 5 | `greek-philosopher`, `spartan-warrior`, `gym-training-expert`, `health-nutrition-expert` |
| 📄 **Documents & Productivity** | 6 | `pdf`, `docx`, `pptx`, `xlsx`, `product-management-expert`, `webapp-testing` |
| 🧩 **Meta & Library** | 2 | `contribute-catalog`, `creator-meta` |

> Counts are generated from the repo. See the **[full catalog](docs/CATALOG.md)** for every skill with descriptions and links.

---

## ⚡ Quick start

### Claude Code (most native)

```bash
# 1. Clone the library
git clone https://github.com/frankxai/claude-skills-library.git ~/claude-skills-library

# 2. Install the skills you want (or all of them)
mkdir -p ~/.claude/skills
cp -r ~/claude-skills-library/free-skills/greek-philosopher ~/.claude/skills/
cp -r ~/claude-skills-library/free-skills/mcp-architecture  ~/.claude/skills/

# 3. Restart Claude Code — skills are auto-discovered
```

Prefer to install everything at once:

```bash
cp -r ~/claude-skills-library/free-skills/* ~/.claude/skills/
```

> Some skills are namespaced under subfolders (e.g. `free-skills/anthropic/pdf`). Copy the
> individual skill folder that contains the `SKILL.md` you want.

### Usage

Skills activate automatically when relevant, or you can invoke one explicitly:

```text
"Use the greek-philosopher skill to examine my career decision."
"Apply spartan-warrior discipline to my procrastination problem."
"Design an MCP server with the mcp-architecture skill."
"Review this PR using the github-code-review skill."
```

---

## 🌐 Works with every runtime

Agent Skills are a portable format. This library documents import paths for the major agentic runtimes:

| Runtime | Maturity | Guide |
|---|---|---|
| Claude Code | ✅ Native | [`runtimes/claude-code.md`](runtimes/claude-code.md) |
| Antigravity (`agy`) | ✅ Substrate-compatible | [`runtimes/antigravity.md`](runtimes/antigravity.md) |
| OpenCode | ✅ Adapter pattern | [`runtimes/opencode.md`](runtimes/opencode.md) |
| Codex CLI | 🟡 Per-skill MCP wrap | [`runtimes/codex.md`](runtimes/codex.md) |
| Gemini CLI | 🟡 Per-skill template | [`runtimes/gemini-cli.md`](runtimes/gemini-cli.md) |
| Cursor | 🟡 Per-skill convert | [`runtimes/cursor.md`](runtimes/cursor.md) |

See [`MULTI_RUNTIME.md`](MULTI_RUNTIME.md) for the universal-MCP rationale and the full strategy.

---

## 🧱 Anatomy of a skill

```
free-skills/<skill-name>/
├── SKILL.md          # required — frontmatter + instructions
├── references/       # optional — deep-dive docs loaded on demand
├── scripts/          # optional — executable helpers the agent can run
└── examples/         # optional — worked examples
```

Every `SKILL.md` starts with YAML frontmatter:

```yaml
---
name: mcp-architecture          # lowercase, hyphenated, ≤ 64 chars
description: Design and implement Model Context Protocol servers...   # when to use this skill
version: 1.0.0
---
```

The `description` is the most important line you'll write — it's what the model uses to decide
**when** to load the skill. Make it specific about the task and trigger conditions.

---

## ✅ Quality & validation

Consistency is what makes this library "world class." A single validator enforces the standard
across every `SKILL.md` in the repo (108 distinct skills, 124 files including runtime variants):

```bash
python3 scripts/validate_skills.py
# OK: 124 skill file(s) are spec-compliant.
```

It checks that every `SKILL.md`:

- has well-formed YAML frontmatter,
- has a `name` matching `^[a-z0-9][a-z0-9-]*$` (≤ 64 chars),
- has a non-empty `description` (≤ 1024 chars),
- is not empty.

Run it before opening a pull request. Wire it into CI to keep contributions clean.

---

## 🆚 How this compares

### vs. one-off prompts

| | A prompt | A skill |
|---|---|---|
| Scope | Single message | Reusable, model-invoked capability |
| Activation | You paste it every time | Loads automatically when relevant |
| Depth | A paragraph | Frameworks, references, runnable scripts |
| Portability | Locked to one chat | Versioned folder, shared across runtimes |

### vs. `obra/superpowers`

`superpowers` is excellent for **development workflows**. This library is **breadth-first across
domains** — AI architecture, Oracle/cloud, creative production, content, and personal performance.
They're complementary: use both.

---

## 🗺️ Roadmap

- [x] Normalize all skills to the official Agent Skills frontmatter spec
- [x] Ship a validator and a generated, categorized catalog
- [x] Document import paths for 6 agentic runtimes
- [ ] CI workflow running `validate_skills.py` on every PR
- [ ] Per-skill `examples/` coverage for the most-used skills
- [ ] One-command installer / Claude Code plugin packaging

---

## 🤝 Contributing

Contributions are welcome — new skills, deeper examples, fixes, and better docs.

1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and the **skill standard**.
2. Add or edit a skill under `free-skills/<skill-name>/SKILL.md`.
3. Run `python3 scripts/validate_skills.py` until it passes.
4. Open a pull request.

---

## 📜 License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

Some skills under `free-skills/anthropic/` retain their original upstream licenses
(see the `LICENSE.txt` next to each). Always check a skill's folder for license notes.

---

## 🙏 Acknowledgments

Built on Anthropic's Agent Skills format and Claude Code best practices, with inspiration from the
broader open-source skills community (including `obra/superpowers`) and current, domain-specific research.

<div align="center">

**[⭐ Star the repo](https://github.com/frankxai/claude-skills-library)** · **[📚 Catalog](docs/CATALOG.md)** · **[🐛 Issues](https://github.com/frankxai/claude-skills-library/issues)** · **[💬 Discussions](https://github.com/frankxai/claude-skills-library/discussions)**

Made with 💙 for the agentic era.

</div>
