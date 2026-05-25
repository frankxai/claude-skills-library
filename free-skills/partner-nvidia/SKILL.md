---
name: partner-nvidia
description: NVIDIA intelligence — NIM microservices, NeMo, NVIDIA AI Enterprise, DGX Cloud, Inception program, EMEA accelerator wave, May 2026 state, Frank's relationship state, integration patterns. Use when generating NVIDIA content, writing about NIM/NeMo/AI Enterprise, partnership-conversation prep for NVIDIA, or evaluating new NVIDIA releases.
---

# NVIDIA — Partner Intelligence

## Current state (as of 2026-05-17)
NIM microservices (NVIDIA Inference Microservices) are the default inference layer for the NVIDIA AI Enterprise stack — containerized, GPU-optimized, multi-cloud-deployable. NeMo continues to anchor the LLM build + finetune surface. DGX Cloud (managed GPU clusters via cloud partners — Oracle, AWS, Azure, GCP) is the enterprise-tier compute lane. The Oracle × NVIDIA AI accelerator pack wave is moving through EMEA channel right now, with Arrow ECS Germany as a primary distribution surface. NVIDIA Inception (startup program) operates a nominee pathway — entry typically through a corporate or VC nomination (to verify current rev). Munich EBC (Executive Briefing Center) is active for partner-event work.

## Product map
- **NIM (NVIDIA Inference Microservices)** — containerized inference for production LLMs and multimodal models. GPU-optimized, multi-cloud-deployable, OpenAI-compatible API surface.
- **NeMo** — framework + microservices for LLM build, finetune, retrieval, and guardrails. Includes NeMo Curator, NeMo Customizer, NeMo Evaluator, NeMo Guardrails, NeMo Retriever.
- **NVIDIA AI Enterprise** — the licensed enterprise stack. NIM + NeMo + AI Workbench + management + support, deployable on certified infrastructure or DGX Cloud.
- **DGX Cloud** — managed GPU clusters delivered through cloud partners (Oracle, AWS, Azure, GCP).
- **AI Workbench** — local + cloud GPU development environment.
- **NVIDIA Blueprints** — opinionated reference architectures (RAG, video search, drug discovery, virtual screening, etc.).
- **CUDA / cuDNN / TensorRT / TensorRT-LLM** — the silicon-layer SDKs.
- **NVIDIA Inception** — startup program. Free tier of credits + technical resources + go-to-market visibility. Nominee pathway. (Entry criteria to verify against current program page.)
- **Partner Network (NPN)** — channel + technology partner tiers for resellers, distributors, OEMs, ISVs.
- **Munich EBC** — Executive Briefing Center for European partner work.
- **Open-source artifacts** — NeMo (Apache 2.0), TensorRT-LLM (Apache 2.0), CUDA-Q (Apache 2.0), many reference blueprints.

## Pricing tiers (May 2026, to verify against current pricing page)
- **Free / individual** — NGC catalog access, free containers for development, AI Workbench free for personal use.
- **NVIDIA AI Enterprise (per-GPU subscription)** — published list price ~$4,500/GPU/year on certified infra (to verify); contact-sales-priced via DGX Cloud and partner channel.
- **DGX Cloud** — contact sales. Pricing flows through Oracle Cloud / AWS / Azure / GCP partner terms.
- **NVIDIA Inception** — free for qualifying startups (eligibility criteria + nomination pathway, to verify against current program page).

## Programs Frank is pursuing
- **NVIDIA Inception — nominee pathway** — exploring entry through the nominee channel. Entry criteria: independent technology or AI-focused company, demonstrated product/service, nominator from the NVIDIA partner ecosystem. Frank's qualifier: AI Architect at Oracle EMEA, four public Claude-Code-native repos, Oracle × NVIDIA partner-event 2025 co-architecture, Munich EBC contacts, 7,000-strong EMEA AI architect audience. Value to Frank: GPU credits + NIM/NeMo enablement + EMEA event visibility.
- **EMEA event lane** — formalizing the partner-event participation channel for the Oracle × NVIDIA accelerator pack wave. Munich EBC bridge active.
- **Oracle × NVIDIA partner-event continuation** — co-architect role in the 2025 partner event; conversation open on the 2026 continuation.

## Frank's working stack with NVIDIA
- **NIM hands-on** — threaded through Oracle EMEA AI CoE reference architectures. Used in `/ai-architecture` Next-on-Vercel reference deploys where the GPU-inference lane is in scope.
- **NeMo Guardrails** — referenced in the AI Architect Academy curriculum guardrails module.
- **DGX Cloud via Oracle Cloud** — Oracle is one of the four DGX Cloud delivery channels. The Oracle EMEA AI CoE practice exposes this lane to enterprise customers.
- **Reference architectures** — multi-cloud, NIM-pattern deployment shapes, GPU-aware agent harnesses. Published in `frankxai/ai-architect-academy` and `oci-ai-architects/claude-code-oci-ai-architect-skills`.
- **Munich EBC contacts** — active from Oracle × NVIDIA partner-event co-architecture work in 2025.

## Frank's audience funnel touching NVIDIA
- **LinkedIn (~7,000 EMEA architects)** — Oracle × NVIDIA accelerator-pack content lands strong on Oracle and silicon-curious architect audiences.
- **Workshop touchpoint** — Build First AI Agent workshop references NIM as the production-inference pattern in the enterprise-track curriculum.
- **Public content surfaces** — `/ai-architecture` (GPU-aware reference architectures with NIM patterns), `/research` (Multi-Cloud Agent Harnesses pillar references NIM), `/ai-coe`.
- **EMEA event surfaces** — Oracle × NVIDIA partner event 2025 + Munich EBC briefing trail.

## Integration patterns Frank ships
1. **NIM-fronted production agent** — NIM microservice for the inference layer behind AI SDK or Claude Agent SDK. Multi-cloud-portable, OpenAI-compatible API at the NIM surface.
2. **NeMo Retriever + NIM RAG stack** — embeddings via NeMo Retriever, inference via NIM, agent orchestration in TypeScript. Reference shape for the multi-cloud RAG blueprint.
3. **NeMo Guardrails layer** — guardrails policy at the agent boundary. Reference in AI Architect Academy guardrails module.
4. **DGX Cloud via Oracle Cloud** — the Oracle EMEA path to managed GPU clusters. Enterprise procurement flows through Oracle Cloud + Arrow ECS Germany channel.
5. **Oracle × NVIDIA AI accelerator pack** — joint go-to-market reference architectures shipped through the EMEA partner channel. Arrow ECS is a primary distribution surface.

## Things to watch (May 2026 → next 90 days)
- **NIM 2.x / next-gen NIM release** — multi-model microservice + improved cold-start (to verify roadmap).
- **NeMo Customizer GA** — managed finetune pipeline. Pricing + integration shape settling.
- **Blackwell B200 + GB200 GPU availability** — supply curve through the partner channel, EMEA distribution timing.
- **Inception program criteria updates** — eligibility + nomination pathway may shift; verify before any application.
- **Oracle × NVIDIA partner event 2026** — continuation of the 2025 co-architecture lane; conversation open.

## Voice rules when writing about NVIDIA
- Verifiable claims only — every product/pricing/program fact resolves to a public URL or is marked "to verify".
- Never "NVIDIA partner" without the program qualifier ("pursuing NVIDIA Inception nominee pathway", or "Oracle × NVIDIA partner-event co-architect 2025").
- Never claim Inception membership Frank does not hold.
- Never claim formal partnership, revenue share, or co-marketing arrangement that does not exist.
- Honor `partner-nvidia` namespace pattern in all references.
- Peer-architect voice — Frank is operator-side (Oracle EMEA AI Architect, Munich EBC contacts from real partner work), not NVIDIA-employee-flavored.
- No emojis, no AI-tone words (delve, dive into, transform, revolutionize, accelerate, journey, unleash, unlock, empower).

## Cross-references
- Public partnership page: https://www.frankx.ai/partnerships/nvidia
- Outreach packet: `docs/private/outreach/2026-05-14-partnerships-send-ready.md`
- Private brief: `.frankx/private/partnerships/nvidia-brief.md` (gitignored — named NVIDIA contacts + Munich EBC briefing trail)
- Public skill: `~/.claude/skills/partner-nvidia/SKILL.md` (this file)
- Specialist agent: `~/.claude/agents/partner-nvidia.md` (separate)
- Working repos: `frankxai/ai-architect-academy`, `oci-ai-architects/claude-code-oci-ai-architect-skills`, `frankxai/starlight-intelligence-system`
- Related partner: Arrow ECS (Oracle × NVIDIA AI accelerator pack EMEA distribution channel)
- Frank's stake: Munich EBC contacts + Oracle × NVIDIA partner-event 2025 co-architect role. The bridge is warm. NVIDIA Inception nominee pathway is the formal lane being pursued.
