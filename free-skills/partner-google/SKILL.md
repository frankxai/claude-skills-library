---
name: partner-google
description: Google Cloud intelligence — Gemini (Nano Banana / Veo / Imagen), Vertex AI, ADK, A2A protocol, Cloud Partner Advantage, May 2026 state, Frank's relationship state, integration patterns. Use when generating Google Cloud content, writing about Gemini/ADK/A2A, partnership-conversation prep for Google, or evaluating new Google Cloud releases.
---

# Google Cloud — Partner Intelligence

## Current state (as of 2026-05-17)
Gemini 3 is the current flagship model line, with Gemini 3.1 Flash Image ("Nano Banana 2" / NB2) as the multimodal image-edit + generation surface, Veo for video, and Imagen for stills. The Google Agent Development Kit (ADK) is the first-party agent framework — Python primary, TypeScript second-class — and the A2A (Agent-to-Agent) protocol is the first-party interop spec for cross-agent communication via Agent Cards. Vertex AI continues to anchor the managed-model + managed-pipeline lane on Google Cloud. Cloud Partner Advantage is the partner program (Sell + Service + Build engagement tracks).

## Product map
- **Gemini (model family)** — Gemini 3 (flagship), Gemini 3 Pro, Gemini 3 Flash, Gemini 3.1 Flash Image (NB2 / Nano Banana 2), Veo (video), Imagen (stills). Frank uses Gemini 3.1 Flash Image daily for multimodal delivery.
- **Vertex AI** — managed model serving, training, evaluation, deployment. The enterprise lane for Gemini and partner models on Google Cloud.
- **Google AI Studio** — developer surface for Gemini API.
- **Agent Development Kit (ADK)** — first-party agent framework. Python primary. Multi-agent orchestration, tool use, deployment to Vertex AI Agent Engine.
- **Agent Engine (Vertex AI)** — managed runtime for ADK agents.
- **A2A protocol (Agent-to-Agent)** — open spec for cross-agent communication via Agent Cards. JSON-RPC-style wire format, capability discovery via Agent Card, task lifecycle primitives. Public spec.
- **Google Agents CLI** — Python CLI + skills bundle for ADK (NOT a separate framework — it ships ADK ergonomics).
- **Google Cloud Partner Advantage** — partner program. Tracks: Sell, Service, Build. Entry criteria: revenue + technical certifications + customer references (to verify against current Partner Advantage page).
- **Open-source artifacts** — ADK (Apache 2.0), A2A protocol spec + reference servers (Apache 2.0), Vertex AI SDK (Apache 2.0).

## Pricing tiers (May 2026, to verify against current pricing page)
- **Free (AI Studio)** — free Gemini API tier with daily request limits, no commercial use on free tier.
- **Pay-as-you-go (Vertex AI)** — per-token pricing. Gemini 3 Pro ~$1.25/$10 per million input/output (to verify); Gemini 3 Flash significantly lower.
- **Veo / Imagen** — per-generation pricing on Vertex AI.
- **Enterprise (Vertex AI + contracted spend)** — committed-use discounts via Google Cloud sales.
- **Agent Engine** — per-agent + per-task compute pricing (to verify).
- **Cloud Partner Advantage** — no fee for entry; revenue + certification gates determine tier.

## Programs Frank is pursuing
- **Google Cloud Partner Advantage** — pursuit underway. Entry criteria: technical certifications (Google Cloud Professional Architect / ML Engineer), customer-reference evidence, demonstrated GCP-aligned delivery. Frank's qualifier: Gemini in daily multimodal delivery, Google ADK + A2A in the workshop enterprise lane and the Starlight Agent Lab three-lane portfolio, public A2A protocol guide at `/guides/agent-card-a2a-spec`, 7,000-strong EMEA architect audience. Value to Frank: workshop attendee credits (the higher-value mechanic over commission), Deploy-to-GCP CTAs on `/ai-architecture` reference deploys, partner attribution.

## Frank's working stack with Google Cloud
- **Gemini 3.1 Flash Image (NB2 / Nano Banana 2)** — daily multimodal delivery. Image hero generation for `/intelligence-system`, `/library`, `/papa`, `/research` content surfaces. Pattern: always derive file extension from `inlineData.mimeType`, never hardcode `.png`. Pass `imageSize: '2K'` to NB Pro for retina hero quality.
- **Veo + Imagen** — video and still generation when the brief calls for them.
- **Google ADK** — enterprise lane in Starlight Agent Lab three-lane portfolio (Vercel AI SDK web / Claude Agent SDK reasoning / Google ADK enterprise).
- **A2A protocol** — public reference implementation documented end-to-end at `/guides/agent-card-a2a-spec`. Written from hands-on use, with wire-level detail an enterprise architect needs.
- **Vertex AI** — referenced in `/ai-architecture` and AI Architect Academy curriculum for the GCP-anchored deploy lane.

## Frank's audience funnel touching Google
- **LinkedIn (~7,000 EMEA architects)** — Gemini and ADK + A2A content lands on the architect audience. The A2A protocol guide is one of the most-referenced pieces in the agent-framework comparison content.
- **Workshop touchpoint** — Build First AI Agent workshop ADK branch — one of the enterprise tracks. Cohort gets hands-on ADK and Agent Cards.
- **Public content surfaces** — `/guides/agent-card-a2a-spec`, `/workshops/build-first-ai-agent`, `/research/agent-frameworks`, `/ai-architecture`, `/ai-coe`, `/os` modules.
- **Public reference implementations** — A2A guide, Starlight Agent Lab three-lane portfolio brief.

## Integration patterns Frank ships
1. **Gemini NB2 image generation** — derive file extension from `inlineData.mimeType` (never hardcode `.png` from slug — caught SIS regression 2026-04-25). Pass `imageSize: '2K'` to NB Pro for retina hero quality.
2. **ADK multi-agent pattern (Python)** — `Agent` + sub-`Agent` orchestration, tool registration, deployment to Vertex AI Agent Engine. Reference shape for the workshop enterprise lane.
3. **A2A protocol implementation** — Agent Card JSON schema (capabilities, skills, endpoints), JSON-RPC-style task lifecycle (`tasks/send`, `tasks/get`, `tasks/cancel`). Reference at `/guides/agent-card-a2a-spec`.
4. **Vertex AI Gemini production deploy** — managed model serving for Gemini on Vertex AI with regional residency. Pattern in the GCP-anchored `/ai-architecture` reference.
5. **Multi-cloud agent harness with ADK enterprise lane** — Vercel AI SDK on the web lane, Claude Agent SDK on the reasoning lane, Google ADK on the enterprise lane. Reference: Starlight Agent Lab three-lane portfolio.

## Things to watch (May 2026 → next 90 days)
- **Gemini 4 family** — next-gen flagship line rumored for mid-2026 (to verify).
- **ADK TypeScript first-class support** — current Python primacy is the friction point for Next-on-Vercel teams.
- **A2A protocol ecosystem maturation** — non-Google reference servers, Anthropic + OpenAI + Vercel adoption signals.
- **Agent Engine GA + pricing settling** — managed runtime pricing shapes the production agent story on GCP.
- **Cloud Partner Advantage AI-track changes** — the program is evolving to recognize agent-platform partners; verify current criteria.

## Voice rules when writing about Google Cloud
- Verifiable claims only — every product/pricing fact resolves to a public URL or is marked "to verify".
- Never "Google Cloud partner" without the program qualifier ("pursuing Google Cloud Partner Advantage").
- Never claim formal partnership, revenue share, or co-marketing arrangement that does not exist.
- Honor `partner-google` namespace pattern in all references.
- The "Google Agents CLI is NOT a framework" correction matters — it is a Python CLI + skills bundle for ADK, not a separate framework. Get this right in all written content.
- Peer-architect voice — Frank is operator-side (Gemini in daily delivery, ADK in workshop), not Google-employee-flavored.
- No emojis, no AI-tone words (delve, dive into, transform, revolutionize, accelerate, journey, unleash, unlock, empower).

## Cross-references
- Public partnership page: https://www.frankx.ai/partnerships/google
- Outreach packet: `docs/private/outreach/2026-05-14-partnerships-send-ready.md`
- Private brief: `.frankx/private/partnerships/google-brief.md` (gitignored)
- Public skill: `~/.claude/skills/partner-google/SKILL.md` (this file)
- Specialist agent: `~/.claude/agents/partner-google.md` (separate)
- Working repos: `frankxai/ai-architect-academy`, `frankxai/FrankX` (A2A guide), `C:\Users\frank\starlight-agent-lab` (ADK enterprise lane)
- A2A guide: https://www.frankx.ai/guides/agent-card-a2a-spec
- Frank's stake: Gemini in daily multimodal delivery. ADK + A2A is the enterprise lane in Build First AI Agent workshop. Public A2A protocol guide already in market. Cloud Partner Advantage is the formal lane being pursued — attendee credits the higher-value mechanic.
