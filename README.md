<div align="center">

# 🧠 Claude Skills Library

### 107 production-grade Agent Skills for Claude Code, Claude.ai, and every major agentic runtime

A free, MIT-licensed catalog of self-contained `SKILL.md` files. Each one teaches your AI agent a
domain — MCP architecture, Next.js, Oracle Cloud, Suno music, code review, and more — with real
frameworks and current best practices, not 500 words of filler.

**For** anyone running Claude Code or another skills-aware agent who wants expert behavior on tap.
**Why not just copy skills by hand?** These are spec-validated, version-tracked, install in one
command, auto-update via the plugin, and load only when relevant — so a library of 107 costs almost
nothing in context until a skill actually fires.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-107-blue.svg)](docs/CATALOG.md)
[![Frontmatter validated](https://img.shields.io/badge/frontmatter-validated-success.svg)](scripts/validate_skills.py)
[![Runtimes](https://img.shields.io/badge/runtimes-6-blueviolet.svg)](#-works-with-six-runtimes)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**⚡ Quick start**](#-quick-start) · [**📚 Full catalog**](docs/CATALOG.md) · [**🗂️ Categories**](#-skill-categories) · [**🤝 Contribute**](#-contributing) · [**❓ FAQ**](#-faq)

</div>

---

## ⚡ Quick start

**Option A — install as a Claude Code plugin (recommended).** One command, auto-updating:

```text
/plugin marketplace add frankxai/claude-skills-library
/plugin install claude-skills-library@claude-skills-library
```

Skills are now discovered automatically and activate when relevant.

**Option B — clone and copy the skills you want:**

```bash
git clone https://github.com/frankxai/claude-skills-library.git ~/claude-skills-library
mkdir -p ~/.claude/skills

# one skill…
cp -r ~/claude-skills-library/free-skills/mcp-architecture ~/.claude/skills/
# …or all of them
cp -r ~/claude-skills-library/free-skills/* ~/.claude/skills/
```

> Some skills are namespaced (e.g. `free-skills/anthropic/pdf`). Copy the folder that directly
> contains the `SKILL.md` you want. Restart Claude Code and the skills are discovered.

**Then just work.** Skills trigger on their own, or invoke one explicitly:

```text
"Use the greek-philosopher skill to examine my career decision."
"Design an MCP server with the mcp-architecture skill."
"Review this PR with the github-code-review skill."
"Write a Suno prompt for a cinematic trailer track."
```

---

## 🚀 What is this?

A curated, open-source library of **[Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)** —
the portable, model-invoked capability format from Anthropic. Drop a skill into your agent and it
gains expert knowledge in a domain: it loads automatically when relevant and stays out of the way
when it isn't.

Every skill here:

- ✅ Is a **self-contained folder** with a `SKILL.md` and optional `references/`, `scripts/`, `assets/`.
- ✅ Has **spec-compliant frontmatter** (`name` + `description`) — enforced by [`scripts/validate_skills.py`](scripts/validate_skills.py).
- ✅ Is **progressive-disclosure friendly**: a tight description for routing, deep guidance loaded only on use.
- ✅ Carries a **trigger-rich description** so the right skill activates from a library this large.

**107 skills** across AI agents, MCP & SDKs, frontend, Oracle/cloud, content & creative production,
engineering workflow, and personal performance. **All free. MIT-licensed.**

---

## 🗂️ Skill categories

Counts below are the source-of-truth groupings from [`docs/CATALOG.md`](docs/CATALOG.md), regenerated
from the repo by [`scripts/generate_catalog.py`](scripts/generate_catalog.py).

| Category | Count | Examples |
|---|---:|---|
| 🤖 **AI Agents & Orchestration** | 15 | `agentic-orchestration`, `swarm-orchestration`, `model-routing`, `reasoningbank-intelligence` |
| 🔌 **AI Frameworks, MCP & SDKs** | 13 | `mcp-architecture`, `mcp-builder`, `openai-agentkit`, `claude-sdk`, `langgraph-patterns` |
| ☁️ **Oracle & Cloud** | 8 | `oracle-ai-architect`, `oracle-database-expert`, `oci-services-expert`, `ai-architecture` |
| 🎨 **Web, Frontend & Animation** | 14 | `nextjs-expert`, `ui-ux-design-expert`, `tailwind`, `gsap`, `three`, `framer-expert` |
| 🛠️ **Engineering Workflow & GitHub** | 9 | `github-code-review`, `performance-analysis`, `verification-quality`, `hooks-automation` |
| ✍️ **Content, Writing & Brand** | 14 | `brand-voice`, `book-publishing`, `social-media-strategy`, `creator-productivity` |
| 🎬 **Creative & Media Production** | 22 | `suno-ai-mastery`, `video-production-workflow`, `hyperframes-media`, `higgsfield-soul-id` |
| 🧭 **Mind, Body & Philosophy** | 5 | `greek-philosopher`, `spartan-warrior`, `gym-training-expert`, `health-nutrition-expert` |
| 📄 **Documents & Productivity** | 6 | `pdf`, `docx`, `pptx`, `xlsx`, `product-management-expert`, `webapp-testing` |
| 🧩 **Meta & Library** | 1 | `contribute-catalog` |

See the **[full catalog](docs/CATALOG.md)** for every skill with its description.

---

## ⭐ A few to start with

| Skill | Why you'd reach for it | Category |
|---|---|---|
| [`nextjs-expert`](free-skills/nextjs-expert/SKILL.md) | App Router, server/client boundaries, caching, and the production gotchas that bite | 🎨 Web, Frontend & Animation |
| [`mcp-architecture`](free-skills/mcp-architecture/SKILL.md) | Design an MCP server's resources, tools, prompts, and security from first principles | 🔌 AI Frameworks, MCP & SDKs |
| [`oracle-database-expert`](free-skills/oracle-database-expert/SKILL.md) | Oracle 23ai, Autonomous DB, AI Vector Search, SQL/PLSQL tuning, HA | ☁️ Oracle & Cloud |
| [`github-code-review`](free-skills/github-code-review/SKILL.md) | Turn a raw diff into a correctness/security/style review with actionable comments | 🛠️ Engineering Workflow & GitHub |
| [`suno-ai-mastery`](free-skills/suno-ai-mastery/SKILL.md) | Prompt-engineer commercial-quality music with Suno v4.5+ | 🎬 Creative & Media Production |
| [`ui-ux-design-expert`](free-skills/ui-ux-design-expert/SKILL.md) | Design systems, interaction patterns, and WCAG 2.2 accessibility audits | 🎨 Web, Frontend & Animation |
| [`langgraph-patterns`](free-skills/langgraph-patterns/SKILL.md) | Graph orchestration, state machines, and human-in-the-loop for agent workflows | 🔌 AI Frameworks, MCP & SDKs |
| [`greek-philosopher`](free-skills/greek-philosopher/SKILL.md) | Socratic questioning and Stoic perspective on a hard decision | 🧭 Mind, Body & Philosophy |

---

## 🆚 Skills vs. MCP vs. prompts

They solve different problems and compose well together.

| | A prompt | An MCP server | An Agent Skill |
|---|---|---|---|
| **What it is** | Text you paste | A connection to tools/data | A model-invoked capability |
| **Gives the agent** | Instructions, once | New actions (APIs, files, DBs) | Expert knowledge + workflow |
| **Activation** | Manual, every time | Always on once connected | Auto-loads when relevant |
| **Token cost** | Pays every turn | Tool schemas always present | ~Free until triggered (progressive disclosure) |
| **Portability** | Locked to one chat | Server you run | A versioned folder, shared across runtimes |

Use a **skill** to teach the agent *how* to do something well; use **MCP** to give it *access* to a
system; use a **prompt** for a one-off. Many skills here pair naturally with an MCP server.

---

## 🌐 Works with six runtimes

Agent Skills are a portable format. This library documents an import path for each major agentic
runtime, with one adapter guide per runtime in [`runtimes/`](runtimes/):

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
├── references/       # optional — deep docs loaded on demand
├── scripts/          # optional — executable helpers the agent runs
└── assets/           # optional — templates, fonts, icons used in output
```

Every `SKILL.md` opens with two-field frontmatter:

```yaml
---
name: mcp-architecture          # lowercase, hyphenated, ≤ 64 chars
description: Design and implement MCP servers... Use when architecting an MCP server...
---
```

The `description` is the most important line you'll write — it's what the model uses to decide
**when** to load the skill. State **what it does and when to use it**, with trigger keywords.

📐 **Authoring standard:** [`spec/README.md`](spec/README.md) · **Start here:** [`template/SKILL.md`](template/SKILL.md)

---

## ✅ Quality & validation

Three zero-dependency scripts enforce the standard across every `SKILL.md`:

```bash
python3 scripts/validate_skills.py          # frontmatter + structure (exits non-zero on failure)
python3 scripts/generate_catalog.py         # regenerate docs/CATALOG.md
python3 scripts/generate_catalog.py --check  # CI-friendly drift check
python3 scripts/check_links.py              # verify no broken internal links
```

All three run automatically on every push and pull request via
[GitHub Actions](.github/workflows/validate.yml). `validate_skills.py` checks that every skill has
well-formed UTF-8 frontmatter, a spec-valid `name`, a non-empty `description` (≤ 1024 chars), and the
exact filename `SKILL.md`; it also warns (without failing) on bodies over 500 lines and on
reserved-word names. Run it before opening a PR.

A browsable catalog is generated by `scripts/generate_site.py` into [`docs/index.html`](docs/index.html)
for serving via GitHub Pages.

---

## 🤝 Contributing

New skills, deeper examples, fixes, and better docs are all welcome.

1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and the [authoring standard](spec/README.md).
2. Copy [`template/`](template/) to `free-skills/<skill-name>/` and write your `SKILL.md`.
3. Run `python3 scripts/validate_skills.py` and `python3 scripts/generate_catalog.py` until both are clean.
4. Open a pull request.

---

## 🔗 Related repositories

This library is the public, install-from storefront. Two sibling repos sit behind it:

- **[frankxai/agentic-creator-os](https://github.com/frankxai/agentic-creator-os)** — the canonical,
  larger internal source for skills, agents, and commands. New skills are authored and battle-tested
  in ACOS first; the strongest, most broadly useful ones are mirrored out to this public library.
- **[frankxai/Starlight-Intelligence-System](https://github.com/frankxai/Starlight-Intelligence-System)** —
  the substrate: the persistent context, memory, and multi-agent layer the skills run on top of.

In short: **Starlight is the substrate, ACOS is the canonical skill source, and this repo is the free public catalog.**

---

## ❓ FAQ

**Does loading 107 skills bloat my context?**
No. Only each skill's `name` + `description` is preloaded for routing; the full body loads **only when
a skill triggers**, and `references/` load only when read. That's the whole point of progressive disclosure.

**How do skills get picked from a library this large?**
By the `description`. Every skill here states *what it does and when to use it* with explicit trigger
keywords, so the model selects the right one. If a skill mis-triggers, sharpen its description — PRs welcome.

**Do I have to install all of them?**
No. Install the plugin for everything, or copy just the folders you want into `~/.claude/skills/`.

**Is this affiliated with Anthropic?**
No. It's an independent, MIT-licensed community library built on Anthropic's open Agent Skills format.
Some skills under `free-skills/anthropic/` are upstream reference skills that retain their original licenses.

**Can I use these outside Claude Code?**
Yes — see [`runtimes/`](runtimes/) for Antigravity, OpenCode, Codex, Gemini CLI, and Cursor.

---

## 📜 License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE). Skills under
`free-skills/anthropic/` retain their original upstream licenses (check the folder for a `LICENSE.txt`).

---

<div align="center">

**[⭐ Star the repo](https://github.com/frankxai/claude-skills-library)** · **[📚 Catalog](docs/CATALOG.md)** · **[🐛 Issues](https://github.com/frankxai/claude-skills-library/issues)** · **[💬 Discussions](https://github.com/frankxai/claude-skills-library/discussions)**

</div>
