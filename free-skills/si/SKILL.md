---
name: si
description: Superintelligence router — composes /superintelligence reasoning with swarm execution only when verb intent demands it. Defaults to reasoning-only to prevent runaway swarm cost. Triggers — /si <ask>, "think deeply about X", "analyze X with full depth", or any ask requiring multi-perspective + first-principles + contrarian framing.
---

# /si — Superintelligence Router

Route ANY ask through this 3-step protocol:

## Step 1 — Classify intent

Parse $ARGUMENTS for verb. Match against these classes:

### Execution verbs (route to: reasoning + swarm)
build, ship, deploy, fix, elevate, create, refactor, migrate, scaffold, wire, sync, audit-and-fix, redesign, rebuild, generate, render

### Reasoning verbs (route to: reasoning only)
think, plan, compare, analyze, should, what if, why, evaluate, audit, research, explore, decide

### Bare topic (no verb)
Route to: reasoning only, then ASK "Should I dispatch a swarm to execute this?"

## Step 2 — Invoke /superintelligence

Always. Pass $ARGUMENTS as the topic. Capture the reasoning output.

Cost: ~5K input + ~3K output tokens, ~$0.05. Cheap enough to always run.

## Step 3 — Route based on Step 1 classification

### If execution intent
After /superintelligence returns, dispatch the appropriate swarm:
- "build / scaffold / create / generate" → BUILD lane (e.g., /v BUILD or feature-dev or frankx-website-builder agent)
- "deploy / ship / sync" → DEPLOY lane (e.g., /v DEPLOY)
- "fix / refactor / migrate" → FIX lane
- "elevate / redesign / rebuild" → ELEVATE lane (e.g., /v ELEVATE)
- "audit-and-fix" → /v ELEVATE
- Multi-domain ambiguity → ask which lane

### If reasoning intent
Return /superintelligence verdict directly. Surface a one-line "Want to execute this?" footer.

### If bare topic
Return /superintelligence verdict. Surface explicit "Should I dispatch a swarm to execute this?" question with 3 options (yes-execute / no-thinking-only / scope-first).

## Cost discipline

- Never auto-dispatch a swarm on a bare-topic ask
- Never skip /superintelligence on execution intent (the framing is the value)
- Per-invocation cost budget: ~$0.05 reasoning + variable swarm cost (~$0.30-$3 per agent × N agents)
- Compare to: a pure /v ELEVATE run is ~$1.50-$5 — /si adds $0.05 of reasoning at the front for better orchestration

## Anti-patterns

- Auto-dispatching swarm on every /si call (burns money on tasks that needed only thinking)
- Skipping /superintelligence on execution (loses multi-perspective framing)
- Treating /si as an alias for /superintelligence (it's a router, not a duplicate)

## Cross-references

- `[[feedback_si_router_design]]` — the design memory
- `/superintelligence` skill — the reasoning primitive
- `/v` skill — the Vercel/Next.js excellence swarm
- `/ultrawork` — parallel agent execution
- `/ao` — model routing
