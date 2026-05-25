---
name: v-swarm
description: Vercel/Next.js excellence swarm orchestration. Use when /v fires, or any time the user asks to build, deploy, audit, research, or fix something on a Next.js+Vercel stack. Routes work to parallel specialist agents (nextjs-vercel-deployment, performance-guardian, frankx-website-builder, accessibility-auditor, ui-ux-design-guidance), runs Vercel MCP deployment checks (deploy_to_vercel, get_deployment, search_vercel_documentation, get_runtime_logs), and grounds recommendations in references/thought-leaders.md, references/best-practices-2026.md, references/deployment-checklist.md.
---

# v-swarm — Vercel/Next.js Excellence Orchestration

Activation: this skill loads when `/v` fires or when the user asks for Vercel/Next.js work. The skill body below is the orchestration logic. Detailed knowledge lives in `references/`.

## Lane classification

Pick exactly one lane per `/v` invocation. If the ask spans multiple, pick the dominant one and surface the others as follow-ups.

| Lane | Triggers in user ask | Decision rule |
|------|----------------------|---------------|
| BUILD | "build", "create", "new page/component", "add", "scaffold" | User wants something new in the codebase |
| DEPLOY | "deploy", "ship", "release", "push to prod", "go live" | User wants something on the actual production URL |
| AUDIT | "audit", "review", "check", "lighthouse", "scan", "is X good" | User wants an assessment, not a change |
| RESEARCH | "what's the best", "should I", "compare", "is X ready", "Lee Robinson recommends" | User wants a recommendation grounded in authority |
| FIX | "broken", "slow", "error", "regression", "not working", "why is" | User has a symptom, wants a root cause |

If unclear: ask one question, never more. Default question: *"Lane — build something new, deploy what's there, audit what's live, research what to do, or fix something that's broken?"*

## Swarm recipes

Each lane has a recipe. Spawn agents in parallel using the `superpowers:dispatching-parallel-agents` skill. Never sequence agents that can run independently.

### BUILD

```
Parallel:
  Agent: frankx-website-builder
    task: implement the requested page/component, follow CLAUDE.md voice + glassmorphic design system
  Agent: ui-ux-design-guidance
    task: review proposed UX, surface accessibility gaps, suggest interaction patterns
  Skill load: nextjs-expert + vercel:nextjs + vercel:react-best-practices
  Optional: /v0-generate for rapid prototype if user mentioned "prototype" or "draft"

Then sequential:
  - Reconcile builder output with UX feedback
  - Run pre-deploy checks (lane = AUDIT subset) on the new code path
  - Surface diff for review
```

### DEPLOY

```
Pre-flight (sequential, fast):
  1. mcp__claude_ai_Vercel__list_projects → confirm correct project name
  2. mcp__claude_ai_Vercel__get_project → confirm framework, latest deployment, build settings
  3. Check git: working tree clean, branch pushed, CI green
  4. Code-review gate: pr-review-toolkit:code-reviewer against the diff
     - If gate returns FAIL → block deploy, surface the issues
     - If WARN → surface but allow with explicit user ack
     - If PASS → proceed
  5. Vercel Agent PR check: gh pr view <N> --json statusCheckRollup
     - Look for "Vercel Agent Review" check
     - SUCCESS → proceed
     - FAILURE → block, surface findings
     - NEUTRAL → proceed (no issues detected)
  6. Surface plan + pause for user confirmation if production-targeted

Action:
  7. mcp__claude_ai_Vercel__deploy_to_vercel (only if confirmed)
  OR vercel deploy --prebuilt --prod (CLI, if local-files deploy needed)
  OR rely on Git push if Vercel project is configured for auto-deploy on the branch

Post-deploy (parallel):
  - mcp__claude_ai_Vercel__get_deployment → status, URL
  - mcp__claude_ai_Vercel__get_deployment_build_logs → warnings, errors, build duration
  - Wait until status = READY (poll list_deployments if needed; never claim ship before ready)

Verify (parallel):
  - mcp__claude_ai_Vercel__get_runtime_logs → smoke check first 60s of traffic for errors
  - vercel logs <deploy-url> (CLI live tail for the first 30s)
  - Curl the deploy URL → HTTP 200 + reasonable response time
  - Spot-check 1-2 critical routes from references/deployment-checklist.md
```

### AUDIT

```
Parallel:
  Agent: performance-guardian
    task: Lighthouse run + bundle analysis + CWV against the live URL
    target: LCP < 2.5s, INP < 200ms, CLS < 0.1 (per references/deployment-checklist.md)
  Agent: accessibility-auditor
    task: WCAG 2.2 sweep, keyboard nav, screen reader spot-check
  MCP: mcp__claude_ai_Vercel__get_runtime_logs
    range: last 24h
    filter: errors + warnings
  MCP: mcp__claude_ai_Vercel__get_deployment_build_logs
    target: last successful deploy
    look for: warnings, slow build steps, large bundles

Synthesize:
  - Prioritize findings by user-impact × effort
  - Output a fix list with: severity, owner-skill (which agent or skill should fix), 1-line fix
  - Cite references/best-practices-2026.md when recommending Next.js 16 patterns
```

### RESEARCH

```
Parallel:
  MCP: mcp__claude_ai_Vercel__search_vercel_documentation
    query: derived from user ask
  Read: references/best-practices-2026.md (relevant section)
  Read: references/thought-leaders.md (find the right voice for this question)
  Optional: 1 WebSearch if the topic is post-knowledge-cutoff or doc gap

Synthesize:
  - Answer in: TL;DR (1 line), Why (3 bullets), Recommendation (1 paragraph), Sources
  - Sources MUST include: official Vercel/Next.js doc URL + at least one named expert with rationale
  - If you can't find authority, say so explicitly — never invent a quote
```

### FIX

```
Sequential start (because debugging is iterative):
  1. Skill load: superpowers:systematic-debugging — follow it, don't shortcut
  2. Reproduce: ask for steps if not given; spin up local dev or hit prod URL
  3. MCP: get_runtime_logs (filter to error level) for the affected route
  4. MCP: get_deployment_build_logs (last build) for warnings
  5. Read the relevant code path

Then parallel:
  Agent: performance-guardian (if symptom = slow/INP regression)
    task: Lighthouse + bundle delta vs last known good
  Agent: accessibility-auditor (if symptom = a11y bug)
    task: WCAG 2.2 spot check on broken flow
  WebSearch: if symptom matches a known issue (Next.js GitHub discussions are gold)

Verify the fix:
  - Reproduce the symptom one more time before claiming fixed
  - Add a regression note if applicable (test, comment, or doc)
```

### ELEVATE

Full audit → gap → fix → ship → teach loop. The leverage lane — every audit becomes a PR + a learning artifact. See `references/elevate-playbook.md` for the complete recipe.

```
Flags:
  --plan-only  : audit + gap-pass only, no fixes. Output markdown report.
  --teach      : force learning artifact (default on when --plan-only=false)
  --auto-fix   : skip Frank-gate, ship fixes immediately after gate-pass

Stage 1 — Audit pass (parallel):
  Agent: vercel:performance-optimizer
    task: CWV against live URL, bundle analysis, Speed Insights regressions
  Agent: performance-guardian
    task: Lighthouse run on all surfaces, prioritize LCP < 2.5s INP < 200ms CLS < 0.1
  Agent: accessibility-auditor
    task: WCAG 2.2 sweep across navigation, forms, content
  Agent: vercel:ai-architect
    task: scan for AI features — direct provider SDK use vs AI Gateway, deprecated model IDs
  MCP: mcp__claude_ai_Vercel__get_runtime_logs (last 7d, errors only)
  MCP: mcp__claude_ai_Vercel__get_deployment_build_logs (last 5 builds)

Stage 2 — Gap pass (sequential):
  Skill load: vercel:knowledge-update (ground truth as of 2026-02-27+)
  For each finding from Stage 1, check against ground truth:
    - Edge Functions used? → Fluid Compute migration
    - vercel.json without vercel.ts? → migrate to vercel.ts
    - Node 18 referenced? → Node 24 LTS
    - PPR without Cache Components? → migrate to Cache Components
    - @ai-sdk/anthropic direct vs AI Gateway? → AI Gateway routing
    - /admin/* without BotID? → wire BotID middleware
    - Dynamic routes without async params? → Next.js 16 fix
    - app/<name>.ts collision with app/<name>/page.tsx? → rename
  Produce: list of gap → fix recipe pairs

Stage 3 — Fix pass (parallel where independent):
  Agent: vercel:deployment-expert
    task: config-level fixes (vercel.json → vercel.ts, env vars, crons, Node version)
  Agent: frankx-website-builder (or frontend-design:frontend-design)
    task: component-level fixes (server/client boundary, async params, lucide imports)
  Agent: nextjs-expert
    task: App Router patterns (Cache Components, server actions, parallel routes)
  Each fix → atomic commit on a dedicated branch elevate/<repo>-<date>

Stage 4 — Ship pass (sequential):
  - Open PR with full fix bundle
  - Gate: pr-review-toolkit:code-reviewer must PASS or WARN+ack
  - Gate: Vercel Agent PR check (server-side) must not return FAILURE
  - Admin-merge past pre-existing CI debt (per standing pattern)
  - NEVER admin-merge past missing review or Agent FAILURE
  - Post-merge: verify URLs return 200, smoke-check runtime logs

Stage 5 — Teach pass (optional, default on):
  Write: docs/learning/<date>-<topic>.md
  Body: WHAT changed (3 bullets), WHY old pattern deprecated (1 paragraph),
        HOW new pattern works (code sample), WHEN to apply elsewhere (1 paragraph)
  Length: ≤ 200 words. Becomes a referenceable artifact in the FrankX OS knowledge base.

Cost target per ELEVATE run:
  - Anthropic API: $0.15-0.40 (depends on findings count)
  - Vercel costs: $0 during Agent beta + free MCP queries
  - Wall time: 5-15 minutes
```

## Vercel MCP toolset reference

Available MCP tools, when to use each:

| Tool | Use when |
|------|----------|
| `list_projects` | Need to find or confirm project name. Always before first deploy/get call. |
| `get_project` | Need framework, latest deployment, build settings, env counts. |
| `list_deployments` | Tracking deploys, finding last green build, checking branch state. |
| `get_deployment` | Have a deployment ID, need status/URL/created/ready. |
| `get_deployment_build_logs` | Build failed or want to inspect warnings/duration. |
| `get_runtime_logs` | Production traffic errors, debugging live regressions, post-deploy smoke. |
| `search_vercel_documentation` | Any "is this best practice" question — official source first. |
| `web_fetch_vercel_url` | Pull a specific Vercel URL into context (rare; for non-doc Vercel pages). |
| `deploy_to_vercel` | Ship. Only after pre-flight + explicit user confirmation if production-targeted. |
| `check_domain_availability_and_price` | New domain purchase decisions. |
| `list_teams` | Multi-team setup; rarely needed. |
| Toolbar threads (`get_toolbar_thread`, `list_toolbar_threads`, etc.) | When user mentions a Vercel comment/feedback thread. |

## When to invoke other skills + commands

These already exist and should be referenced, not recreated. Use plugin-namespaced names (`vercel:*`) when calling vercel-plugin skills.

- **`nextjs-expert`** — deep Next.js knowledge, load when implementation depth needed
- **`nextjs-react-expert`** — React patterns inside Next.js
- **`vercel:nextjs`** — Vercel's official Next.js skill (App Router, Server Components, Cache Components)
- **`vercel:next-cache-components`** — Next.js 16 Cache Components + PPR (always load when discussing caching post-Nov 2025)
- **`vercel:react-best-practices`** — React optimization rules
- **`vercel:ai-sdk`** — AI SDK integration
- **`vercel:deployments-cicd`** — deployment + CI/CD playbook (always load for DEPLOY lane)
- **`vercel:knowledge-update`** — Vercel platform corrections (Fluid Compute, vercel.ts, Node 24 LTS, 300s default timeout). Already auto-injected at session start.
- **`vercel:verification`** — pre-ship verification gate
- **`v0-generate`** — UI prototyping via v0 MCP (command)
- **`frankx-ai-deploy`** — full deploy ceremony with quality checks (BUILD lane handoff for big features)
- **`nextjs-vercel-deployment`** agent — full-stack expert for any non-trivial implementation
- **`performance-guardian`** agent — CWV, Lighthouse, bundle (always for AUDIT/FIX)
- **`accessibility-auditor`** agent — WCAG 2.2 (always for AUDIT)
- **`ui-ux-design-guidance`** agent — design review + interaction patterns (BUILD lane)
- **`frankx-website-builder`** agent — opinionated FrankX brand builder
- **`superpowers:dispatching-parallel-agents`** — the protocol for parallel spawn
- **`superpowers:systematic-debugging`** — required for FIX lane
- **`superpowers:verification-before-completion`** — required before claiming done

## Reporting format

Every `/v` run ends with this receipt:

```
=== /v Receipt ===
Lane: {BUILD|DEPLOY|AUDIT|RESEARCH|FIX}
Ask: {one-line summary}
Swarm: {agents + skills + MCPs invoked, parallel|sequential}
Vercel MCP checks: 
  - {tool} → {one-line result}
  - {tool} → {one-line result}
Findings: 
  - {3-5 bullets, prioritized}
Artifacts: 
  - {path or URL with SHA/deploy ID}
References cited: 
  - {URL or references/file.md#section}
Next suggested action: {one line}
```

## Anti-patterns

- **Never fabricate Vercel MCP results.** If a tool fails or isn't available, say so. Don't simulate output.
- **Never invent thought-leader quotes.** If you don't have a sourced quote, paraphrase and cite the role ("per Vercel's docs", "per Next.js core team guidance"), or use WebSearch to ground it.
- **Never auto-`deploy_to_vercel` to a production project without explicit user confirmation in this turn.** "ship", "deploy to prod", "go live" → still confirm the target project + branch one time.
- **Never sequence parallel-able work.** If two agents have no shared state, spawn parallel — that's the whole point of the swarm.
- **Never recreate skill knowledge.** If `nextjs-expert` already covers App Router, link to it instead of restating.
- **Never skip the receipt.** The receipt is the contract — without it the user doesn't know what actually ran.
- **Never recommend Edge Functions, even if a sibling `vercel:*` skill suggests them.** Per `vercel:knowledge-update` (2026-02-27, auto-injected at session start), Edge Functions are deprecated in favor of Fluid Compute — same regions, same price, full Node.js, 300s default timeout, Node 24 LTS. Some plugin-cached skills (`vercel:vercel-functions`, `vercel:routing-middleware`, `vercel:deployments-cicd`) still teach Edge as a first-class option; treat `vercel:knowledge-update` as ground truth and override sibling guidance accordingly.
- **Never recommend `vercel.json` over `vercel.ts` for new platform config.** `vercel.ts` is the recommended way (typed `VercelConfig`, env-aware logic, programmatic functions). `vercel.json` still works for simple cases. FrankX currently uses `vercel.json` — migrate when typed/dynamic config is needed.

## References (load on demand)

- `references/thought-leaders.md` — current top voices on Vercel/Next.js (Rauch, Robinson, Clark, Markbåge, Theo Browne, Neutkens, Shu Ding, Delba de Oliveira) with handles, primary topics, and when to cite each
- `references/best-practices-2026.md` — Next.js 16 patterns: Cache Components, PPR, `'use cache'`, Server Components, streaming, edge runtime, image optimization
- `references/deployment-checklist.md` — Vercel production checklist: Speed Insights, Observability Plus, CSP, Deployment Protection, WAF, Log Drains, rate limiting, CWV targets
