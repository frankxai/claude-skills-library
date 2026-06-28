# 📚 Skills Catalog
The complete index of all **108 skills** in this library. Every skill ships as a self-contained `SKILL.md` with spec-compliant frontmatter (`name`, `description`) and works across Claude Code, Claude.ai, and other agentic runtimes (see [`runtimes/`](../runtimes/)).

> This file is generated. After adding or renaming a skill, run `python3 scripts/generate_catalog.py` to regenerate it, then `python3 scripts/validate_skills.py` to verify compliance.

## AI Agents & Orchestration
_15 skills_

| Skill | Description |
|---|---|
| [`agentic-jujutsu`](../free-skills/agentic-jujutsu/SKILL.md) | Quantum-resistant, self-learning version control for AI agents, with ReasoningBank intelligence and multi-agent coordination. Use when designing agent memory/versioning, coordin... |
| [`agentic-orchestration`](../free-skills/agentic-orchestration/SKILL.md) | Patterns for multi-agent coordination, task decomposition, handoffs, and workflow orchestration. Use when designing or debugging agent systems, splitting a large task across sub... |
| [`hive-mind-advanced`](../free-skills/hive-mind-advanced/SKILL.md) | Queen-led collective-intelligence coordination with consensus mechanisms and persistent shared memory. Use when orchestrating a large swarm of agents under a lead coordinator, b... |
| [`memory-prune`](../free-skills/memory-prune/SKILL.md) | Manual reviewable prune of stale memory entries. Lists project_* entries older than 30 days with content preview; Frank decides per-entry [keep \| archive \| pin]. Keeps MEMORY.... |
| [`model-routing`](../free-skills/model-routing/SKILL.md) | Intelligent model selection — routes tasks to Haiku (fast/cheap), Sonnet (balanced), or Opus (complex/strategic) by analyzing task complexity. Use when deciding which model to r... |
| [`nextjs-agent-team`](../free-skills/nextjs-agent-team/SKILL.md) | Multi-agent workflow for planning, building, testing, and shipping Next.js applications. Use when building a Next.js app end-to-end with a team of specialist agents, or coordina... |
| [`opus-extended-thinking`](../free-skills/opus-extended-thinking/SKILL.md) | Use Claude's extended/adaptive thinking for deep reasoning, complex analysis, and multi-step synthesis — both the prompt patterns that elicit deliberation and the current thinki... |
| [`pair-programming`](../free-skills/pair-programming/SKILL.md) | AI-assisted pair programming with multiple modes (driver/navigator/switch), real-time verification, quality monitoring, and comprehensive testing. Supports TDD, debugging, refac... |
| [`reasoningbank-agentdb`](../free-skills/reasoningbank-agentdb/SKILL.md) | Implement ReasoningBank adaptive learning with AgentDB's 150x faster vector database. Includes trajectory tracking, verdict judgment, memory distillation, and pattern recognitio... |
| [`reasoningbank-intelligence`](../free-skills/reasoningbank-intelligence/SKILL.md) | Implement adaptive learning with ReasoningBank for pattern recognition, strategy optimization, and continuous improvement. Use when building self-learning agents, optimizing wor... |
| [`sparc-methodology`](../free-skills/sparc-methodology/SKILL.md) | SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) development methodology with multi-agent orchestration. Use when running a structured spec-to-code workfl... |
| [`stream-chain`](../free-skills/stream-chain/SKILL.md) | Stream-JSON chaining for multi-agent pipelines, data transformation, and sequential workflows. Use when piping output between agents/tools as streaming JSON or building a sequen... |
| [`swarm-advanced`](../free-skills/swarm-advanced/SKILL.md) | Advanced swarm-orchestration patterns for research, development, testing, and complex distributed workflows. Use when scaling beyond a few agents, designing dynamic swarm topolo... |
| [`swarm-orchestration`](../free-skills/swarm-orchestration/SKILL.md) | Orchestrate multi-agent swarms with agentic-flow for parallel task execution, dynamic topology, and intelligent coordination. Use when scaling beyond single agents, implementing... |
| [`v-swarm`](../free-skills/v-swarm/SKILL.md) | Vercel/Next.js excellence swarm orchestration. Use when /v fires, or any time the user asks to build, deploy, audit, research, or fix something on a Next.js+Vercel stack. Routes... |

## AI Frameworks, MCP & SDKs
_13 skills_

| Skill | Description |
|---|---|
| [`claude-sdk`](../free-skills/claude-sdk/SKILL.md) | Build autonomous AI agents with the Claude Agent SDK — computer use, tool calling, MCP integration, and production best practices for Anthropic models. Use when writing agent co... |
| [`langgraph-patterns`](../free-skills/langgraph-patterns/SKILL.md) | Production-grade agentic workflows with LangGraph — graph orchestration, state machines, human-in-the-loop, and advanced control flow. Use when building or debugging a LangGraph... |
| [`mcp-2025-patterns`](../free-skills/mcp-2025-patterns/SKILL.md) | Current best practices for Model Context Protocol server design, implementation, and integration, including multi-server orchestration, security, and performance. Use when desig... |
| [`mcp-architecture`](../free-skills/mcp-architecture/SKILL.md) | Design and implement Model Context Protocol servers with resources, tools, prompts, and security best practices. Use when architecting an MCP server, modeling its resources/tool... |
| [`mcp-builder`](../free-skills/anthropic/mcp-builder/SKILL.md) | Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP serve... |
| [`openai-agentkit`](../free-skills/openai-agentkit/SKILL.md) | Build production multi-agent systems with OpenAI AgentKit and the Agents SDK — orchestration, handoffs, and routines. Use when writing agents against OpenAI's AgentKit/Agents SD... |
| [`oracle-adk`](../free-skills/oracle-adk/SKILL.md) | Build production agentic applications on OCI with Oracle's Agent Development Kit — multi-agent orchestration, function tools, and enterprise patterns. Use when developing agents... |
| [`oracle-agent-spec`](../free-skills/oracle-agent-spec/SKILL.md) | Design framework-agnostic AI agents with Oracle's Open Agent Specification for portable, interoperable agents defined in JSON/YAML. Use when authoring an Open Agent Spec definit... |
| [`partner-anthropic`](../free-skills/partner-anthropic/SKILL.md) | Anthropic intelligence — Claude model family, Claude Code, MCP protocol, Claude for Work programs, May 2026 state, Frank's relationship state, integration patterns. Use when gen... |
| [`partner-arrow`](../free-skills/partner-arrow/SKILL.md) | Arrow Electronics ECS intelligence — ArrowSphere marketplace, AI Accelerator program, Oracle Global Distributor of the Year 2025, Oracle x NVIDIA accelerator pack, May 2026 stat... |
| [`partner-google`](../free-skills/partner-google/SKILL.md) | Google Cloud intelligence — Gemini (Nano Banana / Veo / Imagen), Vertex AI, ADK, A2A protocol, Cloud Partner Advantage, May 2026 state, Frank's relationship state, integration p... |
| [`partner-nvidia`](../free-skills/partner-nvidia/SKILL.md) | NVIDIA intelligence — NIM microservices, NeMo, NVIDIA AI Enterprise, DGX Cloud, Inception program, EMEA accelerator wave, May 2026 state, Frank's relationship state, integration... |
| [`partner-vercel`](../free-skills/partner-vercel/SKILL.md) | Vercel intelligence — Next.js + Turbopack, AI SDK, AI Gateway, Fluid Compute, Sandbox, Queues, Agent, Vercel Partner Program, May 2026 state, Frank's relationship state, integra... |

## Oracle & Cloud
_8 skills_

| Skill | Description |
|---|---|
| [`ai-architecture`](../free-skills/ai-architecture/SKILL.md) | Expert guidance on multi-cloud architecture, cost analysis, and technical decision-making for AI platforms across AWS, GCP, Azure, and OCI. Use when comparing clouds, estimating... |
| [`oci-drawio-icon-native`](../free-skills/oci-drawio-icon-native/SKILL.md) | Build and validate OCI draw.io diagrams in icon-native mode so they never depend on `mxgraph.oci.*` runtime libraries. Use when authoring or fixing Oracle Cloud architecture dia... |
| [`oci-services-expert`](../free-skills/oci-services-expert/SKILL.md) | Expert guidance on Oracle Cloud Infrastructure services, architecture patterns, cost optimization, and deployment strategies. Use when designing on OCI, selecting OCI services,... |
| [`oracle-ai-architect`](../free-skills/oracle-ai-architect/SKILL.md) | Deep reference for Oracle AI architecture with end-to-end technical implementations. Use when architecting Oracle AI/GenAI solutions, designing enterprise Oracle AI systems, or... |
| [`oracle-confidentiality`](../free-skills/oracle-confidentiality/SKILL.md) | Enforce confidentiality across Oracle deliverables — pre-delivery audits, codename enforcement, and content sanitization. Use before any Oracle client handoff, when sanitizing d... |
| [`oracle-database-expert`](../free-skills/oracle-database-expert/SKILL.md) | Expert Oracle Database engineering across Oracle Database 23ai, Autonomous Database, SQL/PLSQL tuning, AI Vector Search, JSON Relational Duality, partitioning, high availability... |
| [`oracle-solution-design`](../free-skills/oracle-solution-design/SKILL.md) | Orchestrate complete OCI solution designs with parallel agents and quality gates, producing Solution Design Documents, architectures, and bills of materials. Use when producing... |
| [`si`](../free-skills/si/SKILL.md) | Superintelligence router — composes /superintelligence reasoning with swarm execution only when verb intent demands it. Defaults to reasoning-only to prevent runaway swarm cost.... |

## Web, Frontend & Animation
_14 skills_

| Skill | Description |
|---|---|
| [`animejs`](../free-skills/animejs/SKILL.md) | Anime.js adapter patterns for HyperFrames. Use when writing Anime.js animations or timelines inside HyperFrames compositions, registering animations on window.__hfAnime, making... |
| [`css-animations`](../free-skills/css-animations/SKILL.md) | CSS animation adapter patterns for HyperFrames. Use when authoring CSS keyframes, animation-delay based timing, animation-fill-mode, animation-play-state, or CSS-only motion tha... |
| [`defuddle`](../free-skills/defuddle/SKILL.md) | Extract clean markdown content from web pages using Defuddle CLI, removing clutter and navigation to save tokens. Use instead of WebFetch when the user provides a URL to read or... |
| [`framer-expert`](../free-skills/framer-expert/SKILL.md) | Expert Framer design and development — interactive prototypes, production sites, Framer Motion, CMS integration, and the Framer MCP server. Use when building or styling Framer s... |
| [`gsap`](../free-skills/gsap/SKILL.md) | GSAP animation reference for HyperFrames. Covers gsap.to(), from(), fromTo(), easing, stagger, defaults, timelines (gsap.timeline(), position parameter, labels, nesting, playbac... |
| [`lottie`](../free-skills/lottie/SKILL.md) | Lottie and dotLottie adapter patterns for HyperFrames. Use when embedding lottie-web JSON animations, .lottie files, @lottiefiles/dotlottie-web players, registering instances on... |
| [`nextjs-expert`](../free-skills/nextjs-expert/SKILL.md) | Comprehensive Next.js expertise across App Router, server/client boundaries, data and caching patterns, and production operations. Use when building, debugging, or optimizing a... |
| [`nextjs-react-expert`](../free-skills/nextjs-react-expert/SKILL.md) | Advanced Next.js (App Router) and React engineering for architecture, server/client boundaries, data fetching, caching, performance, and production operations. Use when building... |
| [`nextjs-upgrade-assistant`](../free-skills/nextjs-upgrade-assistant/SKILL.md) | Guided Next.js upgrade workflow — version migration, compatibility checks, and safe rollout. Use when upgrading Next.js across major versions, resolving breaking changes, or pla... |
| [`tailwind`](../free-skills/tailwind/SKILL.md) | Tailwind CSS v4.2 browser-runtime patterns for HyperFrames compositions. Use when scaffolding or editing projects created with `hyperframes init --tailwind`, writing Tailwind ut... |
| [`three`](../free-skills/three/SKILL.md) | Three.js and WebGL adapter patterns for HyperFrames. Use when creating deterministic Three.js scenes, WebGL canvas layers, AnimationMixer timelines, camera motion, shader-driven... |
| [`ui-ux-design-expert`](../free-skills/ui-ux-design-expert/SKILL.md) | Expert guidance on UI/UX design, design systems, accessibility (WCAG 2.2), user research, and creating inclusive, user-centered interfaces with 2025 best practices. Use when des... |
| [`waapi`](../free-skills/waapi/SKILL.md) | Web Animations API adapter patterns for HyperFrames. Use when authoring element.animate() motion, Animation currentTime seeking, document.getAnimations(), KeyframeEffect timing,... |
| [`web-design-expert`](../free-skills/web-design-expert/SKILL.md) | Web design and UX guidance for visual systems, accessibility, interaction patterns, and performance-aware interfaces. Use when designing a website's look and feel, improving UX/... |

## Engineering Workflow & GitHub
_9 skills_

| Skill | Description |
|---|---|
| [`github-code-review`](../free-skills/github-code-review/SKILL.md) | Comprehensive GitHub pull-request code review with multi-agent coordination. Use when reviewing a PR or diff, auditing changes for correctness/security/style before merge, or ge... |
| [`github-multi-repo`](../free-skills/github-multi-repo/SKILL.md) | Multi-repository coordination, synchronization, and architecture management across many GitHub repos. Use when changes span several repositories, keeping repos in sync, or plann... |
| [`github-project-management`](../free-skills/github-project-management/SKILL.md) | GitHub project management with issue tracking, project-board automation, and sprint planning. Use when triaging or organizing issues, automating a project board, planning a spri... |
| [`github-release-management`](../free-skills/github-release-management/SKILL.md) | GitHub release orchestration — automated versioning, testing, deployment, and rollback. Use when cutting a release, tagging a version, drafting release notes, or coordinating a... |
| [`hooks-automation`](../free-skills/hooks-automation/SKILL.md) | Automated coordination, formatting, and learning from Claude Code operations using intelligent hooks with MCP integration. Includes pre/post task hooks, session management, Git... |
| [`performance-analysis`](../free-skills/performance-analysis/SKILL.md) | Performance analysis, bottleneck detection, and optimization recommendations. Use when profiling slow code or systems, hunting a performance regression, or producing an optimiza... |
| [`verification-quality`](../free-skills/verification-quality/SKILL.md) | Truth scoring, code-quality verification, and automatic rollback with a high accuracy threshold. Use when validating agent output before it ships, gating changes on quality, or... |
| [`worker-benchmarks`](../free-skills/worker-benchmarks/SKILL.md) | Run comprehensive worker-system benchmarks and performance analysis. Use when benchmarking worker throughput/latency, comparing worker configurations, or diagnosing worker perfo... |
| [`worker-integration`](../free-skills/worker-integration/SKILL.md) | Worker–agent integration for intelligent task dispatch and performance tracking. Use when wiring agents to a worker pool, routing tasks to workers, or instrumenting worker perfo... |

## Content, Writing & Brand
_14 skills_

| Skill | Description |
|---|---|
| [`ai-architect-newsletter`](../free-skills/ai-architect-newsletter/SKILL.md) | Generate high-quality AI Architect newsletters with latest AI news, research integration, and visual design. Use when creating newsletters, researching AI developments, synthesi... |
| [`arcanea-book-cover`](../free-skills/arcanea-book-cover/SKILL.md) | Design and generate premium book covers using NB2 (Nano Banana 2 / Gemini 3.1 Flash Image) with deep thinking about book tension, emotion, and genre. Pulls from top book cover d... |
| [`book-publishing`](../free-skills/book-publishing/SKILL.md) | Multi-book content, voice, and production workflows for nonfiction authoring. Use when planning a book, maintaining consistent voice across chapters, structuring a manuscript, o... |
| [`brand-guidelines`](../free-skills/anthropic/brand-guidelines/SKILL.md) | Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use it when brand colors or style guidel... |
| [`brand-voice`](../free-skills/brand-voice/SKILL.md) | Apply and enforce brand voice across all content creation. Manages voice attributes, tone adaptation by channel, style rules, and terminology. Use when writing content, reviewin... |
| [`content-strategy`](../free-skills/creative/content-strategy/SKILL.md) | Strategic content planning with pillar mapping, editorial calendars, and SEO optimization. Use this skill when planning content, managing editorial calendars, auditing existing... |
| [`creator-intelligence`](../free-skills/technical/creator-intelligence/SKILL.md) | Transform Claude Code into your personal Jarvis - an AI operating system that knows your projects, preferences, and workflows across sessions. Use this skill when setting up per... |
| [`creator-meta`](../free-skills/creator-meta/SKILL.md) | Creator-agnostic operating-system substrate. The abstract layer model + decision tree + brand-discipline framework that any creator can inherit and specialize. Use when designin... |
| [`creator-productivity`](../free-skills/creator-productivity/SKILL.md) | Task management and workspace memory for creative work sessions. Manages a TASKS.md file for project tracking, a two-tier memory system (CREATOR.md + creator-memory/), and a dai... |
| [`excellence-book-writing`](../free-skills/excellence-book-writing/SKILL.md) | High-quality nonfiction writing patterns for structure, clarity, narrative flow, and editorial polish. Use when drafting or revising long-form nonfiction, tightening chapters, o... |
| [`internal-comms`](../free-skills/anthropic/internal-comms/SKILL.md) | A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use this skill whenever asked to write so... |
| [`prompt-hub`](../free-skills/prompt-hub/SKILL.md) | Compose the 13-agent Prompt Hub team via @prompt-conductor. Use when designing prompts, optimizing prompts, evaluating prompts, importing patterns from Fabric / awesome-chatgpt-... |
| [`slack-gif-creator`](../free-skills/anthropic/slack-gif-creator/SKILL.md) | Toolkit for creating animated GIFs optimized for Slack, with validators for size constraints and composable animation primitives. This skill applies when users request animated... |
| [`social-media-strategy`](../free-skills/social-media-strategy/SKILL.md) | Platform-specific tactics, content optimization, audience growth, and analytics-driven social media strategy. Use when planning a social strategy, optimizing posts for a specifi... |

## Creative & Media Production
_22 skills_

| Skill | Description |
|---|---|
| [`acos-meta`](../free-skills/acos-meta/SKILL.md) | ACOS self-description and configuration skill. Documents how ACOS works, how to extend it, how to add new skills/commands/agents, and how to debug the hook system. Use when buil... |
| [`acos-visual-gen`](../free-skills/acos-visual-gen/SKILL.md) | Generate research-grounded visuals using the InfoGenius pipeline. Use when creating infographics, diagrams, educational visuals, or any image that benefits from factual accuracy... |
| [`algorithmic-art`](../free-skills/anthropic/algorithmic-art/SKILL.md) | Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithm... |
| [`arcanea-infogenius`](../free-skills/arcanea-infogenius/SKILL.md) | Visual intelligence system for generating on-brand infographics, diagrams, and imagery with the Arcanea Gates color and composition framework. Use when creating branded infograp... |
| [`arcanea-meta`](../free-skills/arcanea-meta/SKILL.md) | Arcanea ecosystem self-description. Use when asked about the system map, where things live, canonical locations, how to add a skill/command/agent/hook, how to absorb a repo, or... |
| [`artifacts-builder`](../free-skills/anthropic/artifacts-builder/SKILL.md) | Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifact... |
| [`cacos`](../free-skills/cacos/SKILL.md) | Claude Agentic Creator OS — a native Claude Code implementation of the creator operating system. Use when setting up, extending, or operating ACOS-style skills, agents, and comm... |
| [`canvas-design`](../free-skills/anthropic/canvas-design/SKILL.md) | Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a poster, piece of art, design, or other s... |
| [`higgsfield-generate`](../free-skills/higgsfield-generate/SKILL.md) | Generate images/videos via Higgsfield AI. Default: GPT Image 2 for images/design/text, Seedance 2.0 for video, Nano Banana 2/Pro for character/reference image work, Marketing St... |
| [`higgsfield-marketplace-cards`](../free-skills/higgsfield-marketplace-cards/SKILL.md) | Generate marketplace product image cards through Higgsfield: compliant main image, secondary product images, and A+ style content modules. Use when the user asks for marketplace... |
| [`higgsfield-product-photoshoot`](../free-skills/higgsfield-product-photoshoot/SKILL.md) | Generate brand-quality product images through Higgsfield product-photoshoot prompt enhancement on GPT Image 2 / gpt_image_2. Entry point for professional brand/product visuals.... |
| [`higgsfield-soul-id`](../free-skills/higgsfield-soul-id/SKILL.md) | Train a Soul Character — a personalized model on a person's face that Higgsfield uses for identity-faithful image and video generation. Use when: "create my Soul", "train my fac... |
| [`hyperframes-cli`](../free-skills/hyperframes-cli/SKILL.md) | HyperFrames CLI dev loop — `npx hyperframes` for scaffolding (init), validation (lint, inspect), preview, render, and environment troubleshooting (doctor, browser, info, upgrade... |
| [`hyperframes-media`](../free-skills/hyperframes-media/SKILL.md) | Asset preprocessing for HyperFrames compositions — text-to-speech narration (Kokoro), audio/video transcription (Whisper), and background removal for transparent overlays (u2net... |
| [`hyperframes-registry`](../free-skills/hyperframes-registry/SKILL.md) | Install and wire registry blocks and components into HyperFrames compositions. Use when running hyperframes add, installing a block or component, wiring an installed item into i... |
| [`remotion-to-hyperframes`](../free-skills/remotion-to-hyperframes/SKILL.md) | Translate an existing Remotion (React-based) video composition into a HyperFrames HTML composition. Use ONLY when the user explicitly asks to port, convert, migrate, translate,... |
| [`starlight-chronicle`](../free-skills/starlight-chronicle/SKILL.md) | The reflective layer of the FrankX OS. A four-cadence practice — weekly Palace Review, monthly Survey, quarterly Constellation Census, annual Legacy Audit — that witnesses what'... |
| [`suno-ai-mastery`](../free-skills/suno-ai-mastery/SKILL.md) | Expert prompt engineering and music generation with Suno AI v4.5+ for professional-quality songs across all genres. Use when writing Suno prompts, designing song structure/style... |
| [`suno-prompt-architect`](../free-skills/suno-prompt-architect/SKILL.md) | Expert Suno AI prompt engineering for professional music creation. Use this skill when creating Suno prompts for any AI-generated music that needs commercial quality. |
| [`theme-factory`](../free-skills/anthropic/theme-factory/SKILL.md) | Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fonts that you can... |
| [`video-production-workflow`](../free-skills/video-production-workflow/SKILL.md) | End-to-end video production workflow covering ideation, scripting, storyboarding, shooting/recording, editing, sound design, publishing, and data-driven iteration for YouTube, s... |
| [`website-to-hyperframes`](../free-skills/website-to-hyperframes/SKILL.md) | Capture a website and create a HyperFrames video from it. Use when: (1) a user provides a URL and wants a video, (2) someone says "capture this site", "turn this into a video",... |

## Mind, Body & Philosophy
_5 skills_

| Skill | Description |
|---|---|
| [`frankx-daily-execution`](../free-skills/frankx-daily-execution/SKILL.md) | Executes Frank's daily workflow using the FrankX agent system, Starlight Intelligence, and productivity methods. Use when planning Frank's day, running a focused work sprint, or... |
| [`greek-philosopher`](../free-skills/greek-philosopher/SKILL.md) | Channel ancient wisdom through Socratic questioning, Stoic principles, and philosophical inquiry to examine life's deepest questions with poetic eloquence and timeless insight.... |
| [`gym-training-expert`](../free-skills/gym-training-expert/SKILL.md) | Apply cutting-edge exercise science from 2025 research on hypertrophy, progressive overload, biomechanics, and evidence-based training protocols for optimal strength and muscle... |
| [`health-nutrition-expert`](../free-skills/health-nutrition-expert/SKILL.md) | Apply cutting-edge 2025 nutrition science on longevity, metabolic health, gut microbiome, and evidence-based dietary patterns for optimal vitality and disease prevention. Use wh... |
| [`spartan-warrior`](../free-skills/spartan-warrior/SKILL.md) | Embody the unbreakable Spartan ethos of discipline, courage, and relentless excellence through laconic wisdom and warrior mentality forged in hardship. Use when facing procrasti... |

## Documents & Productivity
_6 skills_

| Skill | Description |
|---|---|
| [`docx`](../free-skills/anthropic/docx/SKILL.md) | Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. When Claude needs to work with p... |
| [`pdf`](../free-skills/anthropic/pdf/SKILL.md) | Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms. When Claude needs to fill in a PDF for... |
| [`pptx`](../free-skills/anthropic/pptx/SKILL.md) | Presentation creation, editing, and analysis. When Claude needs to work with presentations (.pptx files) for: (1) Creating new presentations, (2) Modifying or editing content, (... |
| [`product-management-expert`](../free-skills/product-management-expert/SKILL.md) | Product management expertise for strategy, discovery, prioritization, roadmaps, PRDs, metrics, and stakeholder communication. Use when defining what to build, why, and how to me... |
| [`webapp-testing`](../free-skills/anthropic/webapp-testing/SKILL.md) | Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots... |
| [`xlsx`](../free-skills/anthropic/xlsx/SKILL.md) | Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When Claude needs to work with spreadsheets (.... |

## Meta & Library
_1 skill_

| Skill | Description |
|---|---|
| [`contribute-catalog`](../free-skills/contribute-catalog/SKILL.md) | Author a new HyperFrames registry block (caption style, VFX block, transition, lower third) or component (text effect, overlay, snippet) and ship it as an upstream PR to the hyp... |

## Other
_1 skill_

| Skill | Description |
|---|---|
| [`premium-web-os`](../free-skills/premium-web-os/SKILL.md) | Build cinematic, premium, 3D/motion-rich websites with taste and repeatability. Use when designing or building a landing page, hero, marketing site, product page, or any UI that... |
