---
name: agent-design-review
description: Use when the user asks to review, grill, pressure-test, or sanity-check an AI agent or multi-agent system design before building it — triggers include "grill me on my design", "design review", "review my agent architecture", "is this architecture sound", "pressure-test this before I build". Interrogates the design against the four failure modes that kill enterprise agent initiatives and returns a go / no-go verdict with ranked fixes.
version: 1.0.0
---

# Agent Design Review

A user-invoked review. The user types for it. Your job is to **grill their AI-agent-system design before they write code** — adversarially, but to make the design survive production, not to show off. Bad architecture is the most expensive it has ever been; this catches it while it's still free to fix.

You are interrogating against the four failure modes that kill enterprise agent initiatives. Do not skip a mode. Do not soften a red.

## How to run it

1. Get the design. Ask the user to describe it, or read their spec/PRD/diagram. If it's vague, that is itself a finding — a design you can't state plainly is a design that will fail plainly.
2. Interrogate **one failure mode at a time, in order.** Ask the pointed questions. Do not move on until you have a real answer — "we'll figure that out later" is a red, name it.
3. Score each mode RED / YELLOW / GREEN with the specific gap.
4. Deliver the verdict: the four-mode table, the top 3 fixes ranked by blast radius, and an honest **build / fix-first / rethink** call.

## The four interrogations

### 1. Orchestration & failure — "the demo that never ships"
- How does the work decompose into steps, and who owns synthesizing the result?
- When step N fails or a tool call returns garbage, what happens? Retry, escalate, halt, or silently corrupt?
- Is there one coordinator responsible, or do agents hand work back and forth with no owner?
- Would this survive one bad model response, or is it a happy-path demo?

RED if there's no failure path or no synthesis owner. This is the most common killer.

### 2. Context & memory — "the agent that forgets the rules"
- Where does agent behavior live — engineered in files/rules, or in someone's head?
- Are memory/instruction files disciplined (lean, load-bearing), or a growing dump the agent will ignore?
- Does context survive a handoff between steps/agents, or does it evaporate?
- What is the single source of truth for "how this agent behaves"?

RED if behavior is tribal or the memory file is an un-pruned dump.

### 3. Integration — "integration spaghetti"
- Are tools reached through a standard interface (MCP / a defined contract), or bespoke glue per tool?
- What's the N×M exposure — how many agents × how many tools, each wired differently?
- How are tools discovered, authed, and rate-limited? Where do credentials live?

RED if every integration is one-off, or credentials live anywhere but env/secret store.

### 4. Cost & routing — "the invoice that kills the roadmap"
- One model for everything, or routed by task complexity?
- What is the rough $/task, and what does that become at 100× volume?
- What escalates to the expensive model, and what's the cheap default?

RED if it's one frontier model for all work with no routing and no cost estimate.

## The verdict

Deliver exactly this, no padding:

```
DESIGN REVIEW — <one-line design summary>

| Failure mode              | Exposure | The specific gap |
|---------------------------|----------|------------------|
| Orchestration & failure   | R/Y/G    | ...              |
| Context & memory          | R/Y/G    | ...              |
| Integration               | R/Y/G    | ...              |
| Cost & routing            | R/Y/G    | ...              |

TOP FIXES (ranked by blast radius)
1. ...
2. ...
3. ...

CALL: build / fix-first / rethink — <one honest sentence>
```

## Rules

- One mode at a time. Make them answer. A dodge is a finding.
- Cite the failure mode by name — the user should leave knowing which of the four they're exposed to.
- No participation trophies. If three modes are RED, the call is "rethink," and you say so.
- End with the go/no-go. A review with no verdict is just conversation.
