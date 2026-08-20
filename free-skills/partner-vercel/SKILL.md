---
name: partner-vercel
description: Vercel intelligence — Next.js + Turbopack, AI SDK, AI Gateway, Fluid Compute, Sandbox, Queues, Agent, Vercel Partner Program, May 2026 state, Frank's relationship state, integration patterns. Use when generating Vercel content, writing about Next.js or the AI SDK, partnership-conversation prep for Vercel, or evaluating new Vercel releases.
---

# Vercel — Partner Intelligence

## Current state (as of 2026-05-17)
Next.js 16 with Turbopack is the default. AI SDK v6 is the current production line. AI Gateway went GA in August 2025 and is now the recommended model-routing layer in front of any production agent. Fluid Compute is the default compute mode for new projects — pay-per-active-CPU billing with sub-second scale-to-zero. The new `vercel.ts` (TypeScript config, replacing `vercel.json`) is shipping. Vercel Sandbox (isolated sandboxes for agentic code execution) went GA in January 2026. Vercel Queues is in beta. Vercel Agent (managed agent runtime) is in beta. Node 24 LTS is the default runtime. Default function timeout sits at 300 seconds on Fluid Compute.

## Product map
- **Next.js 16** — App Router, Turbopack default, Cache Components, Partial Prerendering (PPR), use-cache directive, async params in dynamic routes.
- **Vercel AI SDK v6** — TypeScript-first model SDK. Unified surface over Anthropic, OpenAI, Google, xAI, Cohere, Mistral. Streaming, tool use, generateObject, agents.
- **AI Gateway (GA Aug 2025)** — model-routing layer. One API key, all providers. Caching, observability, fallback routing.
- **Fluid Compute** — default compute mode. Pay-per-active-CPU, sub-second scale-to-zero, 300s default timeout, in-function concurrency.
- **Vercel Sandbox (GA Jan 2026)** — isolated execution sandboxes for agentic code-execution workloads.
- **Vercel Queues (beta)** — managed durable queues for background work.
- **Vercel Agent (beta)** — managed agent runtime built on Sandbox + Queues.
- **Vercel CLI** — `vercel`, `vercel deploy`, `vercel env`, `vercel link`, `vercel logs`.
- **Vercel MCP server** — first-party MCP surface for deployment, logs, project info, runtime traces.
- **`vercel.ts` config** — TypeScript-typed deployment config, replacing `vercel.json`.
- **Partner Program** — Vercel Partner Program (agency + technology tiers). Entry criteria public on vercel.com/partners.
- **Open-source artifacts** — `next` (MIT), `ai` SDK (Apache 2.0), `turbo`/Turbopack (MPL-2.0), MCP server (MIT).

## Pricing tiers (May 2026, to verify against current pricing page)
- **Hobby** — free. Personal projects, non-commercial, limited team features. 100 GB-hours Fluid Compute included.
- **Pro** — $20/seat/mo. Commercial use, increased limits, AI Gateway included, custom domains, observability.
- **Enterprise** — contact sales. SSO, SAML, audit, data residency, custom SLAs, dedicated support, custom Fluid Compute pricing.
- **AI Gateway** — pay-per-token pass-through plus a small routing margin (to verify). Caching cuts billed tokens significantly.
- **Sandbox** — pay-per-second of active sandbox time (to verify exact rate).

## Programs Frank is pursuing
- **Vercel Partner Program (Technology Partner tier)** — application in flight. Entry criteria: production Vercel deploys + AI SDK adoption + reference-architecture content + audience reach. Frank's qualifier: 8+ production deploys under `frankxai` org (frankx.ai, frankx.ai-vercel-website, Watch OS, Workshop OS, Library OS, Studio, ACO, Partnerships) + Vercel AI SDK at the centre of the Build First AI Agent workshop + Next-on-Vercel reference architectures on `/ai-architecture` and `/ai-coe`. Value to Frank: partner attribution + workshop credits + co-marketing on Next-on-Vercel reference deploys.

## Frank's working stack with Vercel
- **Production deploys** — `frankxai/frankx.ai-vercel-website` (live at frankx.ai), plus the eight surfaces listed above. Vercel project: `starlight-intelligence/frankx-ai-vercel-website`.
- **Next.js 16** with Turbopack, Cache Components, async params in dynamic routes (`params: Promise<{...}>`).
- **AI SDK v6** — used across Studio L2/L3 producer pipeline, IIS decision-support, Library OS book-distiller, ACO video system.
- **AI Gateway** — used for model routing in the workshop curriculum and the `/ai-architecture` reference deploys.
- **Fluid Compute** — default mode, 300s timeout. Long-running agent calls use this surface.
- **Vercel MCP** — wired into Claude Code for deployment checks (`deploy_to_vercel`, `get_deployment`, `get_runtime_logs`, `search_vercel_documentation`). Lives in the `/v` skill.
- **`vercel.ts` config + `.vercelignore`** — root-anchored patterns (gitignore-style). `outputFileTracingExcludes` in `next.config.mjs` uses minimatch.
- **`ignoreCommand`** — uses `$VERCEL_GIT_PREVIOUS_SHA`, fails safe to PROCEED. Reference at `scripts/should-deploy.sh`.

## Frank's audience funnel touching Vercel
- **LinkedIn (~7,000 EMEA architects)** — Next.js + AI SDK + Fluid Compute posts land 100+ engagement on the architect audience.
- **Workshop touchpoint** — Build First AI Agent workshop Vercel branch is the central path. Workshop attendees ship their first production agent on AI SDK + Next.js + AI Gateway.
- **Public content surfaces** — `/ai-architecture` (Next-on-Vercel reference architectures), `/ai-coe`, `/os` modules, `/research`, `/blog` Field Notes.
- **Public reference deploys** — every public frankx.ai surface is a Next-on-Vercel reference.

## Integration patterns Frank ships
1. **Next.js 16 async-params pattern** — every dynamic route declares `params: Promise<{...}>` with async/await. Sync syntax from Next 15 builds fine but 404s in prod under Turbopack (caught 2026-05-07 on `/os/[slug]`).
2. **AI SDK + AI Gateway production agent** — `generateText` / `streamText` with `tools`, routed through AI Gateway for caching + provider fallback. Pattern in Studio producers.
3. **Fluid Compute long-running agent** — `export const maxDuration = 300` plus AI SDK streaming. Production agent calls absorb the 300s envelope cleanly.
4. **`vercel.ts` + `.vercelignore` root-anchoring** — patterns prefixed `/` to avoid `gitignore`-style unanchored matches catching unintended subdirs (cost: 1 broken prod deploy on 2026-05-05).
5. **Vercel MCP from Claude Code** — `deploy_to_vercel`, `get_deployment_build_logs`, `get_runtime_logs`, `search_vercel_documentation` — wired into `/v` skill for any Vercel-deployed repo audit.

## Things to watch (May 2026 → next 90 days)
- **Vercel Queues GA** — durable background work primitive. Cleans up the cron + worker patchwork.
- **Vercel Agent GA** — managed agent runtime. Pricing + SLA + memory durability shape the production agent story.
- **Next.js 17** — Cache Components stabilization, partial-prerender defaults, server-action improvements (to verify roadmap).
- **AI SDK v7** — agent loops + memory primitives + structured tool-output shape (to verify roadmap).
- **`vercel.ts` adoption** — full migration window from `vercel.json` likely lands in next 90 days.

## Voice rules when writing about Vercel
- Verifiable claims only — every product/pricing/version fact resolves to a public URL or is marked "to verify".
- Never "official Vercel partner" without the program qualifier ("pursuing Vercel Partner Program — Technology tier").
- Never claim formal partnership, revenue share, or co-marketing arrangement that does not exist.
- Honor `partner-vercel` namespace pattern in all references.
- Peer-architect voice — Frank is operator-side (production deploys on Vercel daily), not Vercel-employee-flavored.
- No emojis, no AI-tone words (delve, dive into, transform, revolutionize, accelerate, journey, unleash, unlock, empower).

## Cross-references
- Public partnership page: https://www.frankx.ai/partnerships/vercel
- Outreach packet: `docs/private/outreach/2026-05-14-partnerships-send-ready.md`
- Private brief: `.frankx/private/partnerships/vercel-brief.md` (gitignored)
- Public skill: `~/.claude/skills/partner-vercel/SKILL.md` (this file)
- Specialist agent: `~/.claude/agents/partner-vercel.md` (separate)
- Working repos: `frankxai/frankx.ai-vercel-website`, `frankxai/FrankX`, `frankxai/agentic-creator-os`, `frankxai/library-os`, `frankxai/starlight-intelligence-system`
- Vercel MCP: wired into Claude Code via `/v` skill
- Frank's stake: Every public frankx.ai surface ships on Vercel. The Build First AI Agent workshop centres Vercel AI SDK. Vercel Partner Program (Technology tier) is the formal lane being pursued.
