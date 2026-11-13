---
name: model-routing
description: Picks the Claude model tier (Haiku, Sonnet, Opus, Fable) and effort level for a task class, with current model IDs and per-token prices. Use when the user asks which Claude model to run, wants to cut API or agent spend by routing work to cheaper tiers, needs exact model IDs or prices for a routing table, or is setting the model on a subagent or Task call. Do not use for ordinary coding, ORM or database "models", ML model training, or general cost questions that do not involve choosing a Claude model.
metadata:
  version: "1.2.0"
  source: "claude-flow routing pattern, rewritten"
---

# Model Routing

Choose the cheapest Claude tier that finishes the task, set its effort level, and escalate only on a
measured failure. Apply this when a model is being chosen. Do not run a routing analysis before every
task.

## Current models

Prices checked 2026-11-11 against the model pricing table at
https://platform.claude.com/docs/en/about-claude/pricing; model IDs against the claude-api skill's
model table (cached 2026-11-03). Prices are first-party API rates in USD per million tokens. Before writing these into code, re-check them with
`GET /v1/models` (or `client.models.list()`) and the models overview at
https://platform.claude.com/docs/en/about-claude/models/overview. Model IDs are complete as written: never
append a date suffix.

| Tier | Model ID | Input USD/1M | Output USD/1M | Context |
|---|---|---|---|---|
| Haiku | `claude-haiku-5-5` | 0.10 (0.50 when the prompt is over 100,000 tokens) | 0.50 (2.50 when the prompt is over 100,000 tokens) | 1M |
| Sonnet | `claude-sonnet-5-5` | 2.00 | 10.00 | 1M |
| Opus (default) | `claude-opus-5-5` | 4.00 | 20.00 | 1M |
| Fable (escalation only) | `claude-fable-5-2` | 8.00 | 40.00 | 1M |

Haiku's prompt length counts every input token, cache reads and writes included, and each request
is priced on its own. `routing-rules.json` in this folder carries the same IDs and prices in
machine-readable form, including the Haiku over-100K rates. Its
`command_routing` and `agent_routing` blocks name FrankX estate commands and agents that do not ship
with this pack; ignore them outside that estate.

## Routing rules

Route by what the task needs, not by keywords alone:

| Route to | When the task is | Examples |
|---|---|---|
| Haiku | Deterministic, fully specified, easy to check | list or read files, format, lint, rename, scaffold boilerplate, status checks, bulk extraction |
| Sonnet | Needs reasoning inside a known pattern | implement a feature, fix a bug with a stack trace, write tests, review a PR, refactor |
| Opus | Ambiguous, multi-file, or high cost of error | architecture, subtle multi-file debugging, security review, planning, research synthesis |
| Fable | Opus already ran and fell short | the single hardest step of a long agentic task; never a first choice |

Before building a multi-model cascade, measure the simpler option: the top model at lower effort
(`output_config: {effort: "low"}` or `"medium"`) on the same tasks. One model keeps one prompt cache;
a cascade splits it, because caches are per model. Judge cost per completed task, not per request.

## Effort

- `low`: subagents, chat, classification, high-volume routes.
- `medium`: default on `claude-opus-5-5` and `claude-haiku-5-5`; set it explicitly.
- `high` or `xhigh`: coding and long agentic runs; `high` is the default on `claude-sonnet-5-5`.
- `max`: only where a measured gain over `xhigh` exists.

## Setting the model on a subagent (Claude Code)

The Agent / Task tool takes a tier alias:

```javascript
Agent({ subagent_type: "Explore", model: "haiku", prompt: "List every file under src/ that imports auth" })
Agent({ subagent_type: "general-purpose", model: "sonnet", prompt: "Add a unit test for parseDate in src/date.ts" })
Agent({ subagent_type: "Plan", model: "opus", prompt: "Design tenant isolation for the billing service" })
```

In API code, pass the full model ID from the table: `model: "claude-sonnet-5-5"`.

## Escalation

```
haiku -> fails check -> sonnet -> fails check -> opus -> fails check -> fable (last resort)
```

"Fails check" means a concrete signal: a test or linter exits non-zero, the output fails its schema,
or a reviewer rejects it. Escalate once per failure, and log the task class with the tier that
finally passed, so the next run starts there.

## Worked cost example

An illustrative mix, output tokens only, at the prices above:

```
All tasks on Opus:            USD 20.00 per 1M output tokens
Routed: 40% Haiku  x 0.50   = USD 0.20
        45% Sonnet x 10.00  = USD 4.50
        15% Opus   x 20.00  = USD 3.00
        total                 USD 7.70  (61.5% less than all-Opus)
```

The saving holds only if the cheaper tiers pass their checks without extra retries. Measure it on
your own traffic before you promise it.

## When sources disagree

If the repository has an eval-derived routing table (for example `starlight-evals/routing-table.json`
in the FrankX estate), its per-task-class route wins over the rules above. This skill stays the
reference for model IDs and prices; other configs should name a tier (`haiku`, `sonnet`, `opus`) and
resolve it here instead of hardcoding IDs.
