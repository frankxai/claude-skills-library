---
name: model-routing
description: Intelligent model selection — routes tasks to Haiku (fast/cheap), Sonnet (balanced), or Opus (complex/strategic) by analyzing task complexity. Use when deciding which model to run, optimizing cost vs quality, or building a tiered routing layer.
triggers:
  - model
  - routing
  - optimize
  - cost
  - haiku
  - sonnet
  - opus
priority: high
version: 1.1.0
source: claude-flow
---

# Model Routing System

You have access to intelligent model routing. Before executing any task, analyze complexity and route to the appropriate model tier.

> **Current model IDs and pricing — Last verified: 2026-08-28. Re-verify at
> [platform.claude.com](https://platform.claude.com/docs/en/about-claude/models/overview) before trusting
> these again; they have moved more than once in 2026.**
> Haiku → `claude-haiku-4-5` ($1.00 / $5.00 per 1M input/output) · Sonnet → `claude-sonnet-5`
> ($2.00 / $10.00) · Opus → `claude-opus-5` ($5.00 / $25.00, default).
> For the hardest long-horizon reasoning, escalate above Opus to **`claude-fable-5`** ($10.00 / $50.00 —
> most capable; thinking is always on, no disabling it; reserve for genuinely demanding work).
> Model IDs are complete as written — never append a date suffix. The tiers below are model-agnostic.

## Routing Decision Matrix

```
TASK COMPLEXITY ANALYSIS
────────────────────────────────────────────────────────────────

HAIKU (Fast, Cheap) - claude-haiku-4-5 - Use for:
├── Simple file operations (read, list, navigate)
├── Scaffolding and boilerplate generation
├── Deterministic transformations (format, lint, compile)
├── Status checks and health monitoring
├── SEO metadata generation
├── Deployment commands (after code is written)
├── Documentation formatting
├── Simple search and replace
│
│   Token cost: $1.00/1M input, $5.00/1M output
│   Latency: Fastest
│   Use when: Task has clear, unambiguous steps

SONNET (Balanced) - claude-sonnet-5 - Use for:
├── Feature implementation (standard complexity)
├── Bug fixes requiring analysis
├── Content writing (articles, social posts)
├── Code review and quality checks
├── Test generation
├── Refactoring with clear patterns
├── API integration work
├── Database schema design
│
│   Token cost: $2.00/1M input, $10.00/1M output
│   Latency: Medium
│   Use when: Task requires reasoning but not deep strategy

OPUS (Strategic, Complex) - claude-opus-5 - Use for:
├── Architecture decisions (system design)
├── Multi-agent coordination (council, swarm)
├── Strategic planning (business, product)
├── Complex debugging (multi-file, subtle bugs)
├── Security audits and vulnerability analysis
├── Enterprise AI system design
├── Book writing (narrative, character development)
├── Research synthesis (multiple sources)
├── Ambiguous requirements interpretation
│
│   Token cost: $5.00/1M input, $25.00/1M output
│   Latency: Slower; most capable of the routine tiers
│   Use when: Task requires deep reasoning, creativity, or strategy

FABLE (Hardest, escalation only) - claude-fable-5 - Use for:
├── Long-horizon agentic work where Opus already fell short
├── The single hardest step in an otherwise-Opus-routed task
│
│   Token cost: $10.00/1M input, $50.00/1M output
│   Latency: Slowest; thinking is always on (cannot be disabled)
│   Use when: Opus-tier reasoning wasn't enough — this is a ceiling, not a starting point
```

## Automatic Routing Rules

When processing a request, apply these rules:

### Route to HAIKU when:
- User says: "deploy", "format", "lint", "check status", "list", "scaffold"
- File patterns: `*.config.*`, `package.json`, `tsconfig.json`
- Commands: `/mcp-status`, `/inventory-status`, `/nextjs-deploy` (execution phase)

### Route to SONNET when:
- User says: "write", "implement", "fix", "create", "build", "test"
- File patterns: `*.ts`, `*.tsx`, `*.py`, `*.md` (content files)
- Commands: `/article-creator`, `/create-music`, `/spec`, `/generate-social`

### Route to OPUS when:
- User says: "design", "architect", "strategy", "council", "analyze", "research"
- Keywords: "enterprise", "system", "multi-agent", "complex", "strategic"
- Commands: `/starlight-architect`, `/council`, `/author-team`, `/research`

### Escalate to FABLE when:
- Opus already ran on the task and the result fell short
- The task is genuinely the hardest tier — long-horizon agentic work, not routine strategy
- Never route here first; Fable is a ceiling for escalation, not a default

## Cost Optimization

```
BEFORE (No routing):
  All tasks → Opus → $25.00/1M output tokens

AFTER (With routing):
  Simple tasks (40%) → Haiku  → $5.00/1M   = $2.00
  Medium tasks (45%) → Sonnet → $10.00/1M  = $4.50
  Complex tasks (15%) → Opus  → $25.00/1M  = $3.75
  ──────────────────────────────────────────────
  TOTAL: $10.25 vs $25.00 = 59% cost reduction
```

## Implementation in Task Tool

When using the Task tool, specify model based on routing:

```javascript
// Simple task - use haiku
Task({
  subagent_type: "Explore",
  model: "haiku",
  prompt: "List all files in src/"
})

// Medium task - use sonnet (default)
Task({
  subagent_type: "code-reviewer",
  model: "sonnet",
  prompt: "Review this PR for issues"
})

// Complex task - use opus
Task({
  subagent_type: "Plan",
  model: "opus",
  prompt: "Design the architecture for a multi-tenant SaaS platform"
})
```

## Command-Level Routing

| Command | Default Model | Rationale |
|---------|---------------|-----------|
| `/acos` | sonnet | Router needs reasoning |
| `/article-creator` | sonnet | Content creation |
| `/create-music` | sonnet | Creative work |
| `/infogenius` | sonnet | Research + creation |
| `/starlight-architect` | **opus** | Strategic design |
| `/council` | **opus** | Multi-perspective |
| `/research` | sonnet | Information synthesis |
| `/spec` | sonnet | Feature planning |
| `/nextjs-deploy` | haiku | Execution |
| `/mcp-status` | haiku | Status check |
| `/inventory-status` | haiku | Status check |
| `/publish` | haiku | Execution |
| `/polish-content` | sonnet | Editing |
| `/review-content` | sonnet | Quality check |

## Escalation Pattern

If a haiku-routed task fails or produces poor results:
1. Automatically escalate to sonnet
2. If still failing, escalate to opus
3. If opus itself falls short on a genuinely hard task, escalate to Fable — last resort, not a retry habit
4. Log escalation for learning

```
haiku (attempt) → fail → sonnet (retry) → fail → opus (retry) → fail (rare) → fable (last resort)
```

## Relationship to other routing configs

This skill is the estate's **model-facts reference** — current model IDs, context windows, and
per-token pricing. It is not the only routing config in the estate, and on task-class routing
decisions it does not have the final word:

- **`starlight-evals/routing-table.json`** is the **evidence-derived source of truth for task-class
  routing** — which tier a task class should hit, backed by eval-round evidence and confidence
  scores rather than the judgment calls in this file. Where its `route` for a task class disagrees
  with the "Route to X when" rules above, the table wins.
- **`agentic-ops-hub/fleet/model-routing.json`** and a referenced `~/.starlight/routing.toml` are
  operational routing configs elsewhere in the estate. They route by abstract tier name (`opus`,
  `sonnet`, ...) and should resolve those names against this skill (or the evals table) rather than
  hardcoding their own model IDs or pricing.
- This skill's job stays narrow: keep the model IDs, context windows, and pricing above correct and
  current. It is not merged with the other three configs here — this section exists only so the next
  agent knows which source to trust when they disagree.

---

*Model Routing v1.1 - Implementing claude-flow's intelligent routing pattern. Last verified: 2026-08-28.*
