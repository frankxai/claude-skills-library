---
name: prompt-hub
description: Compose the 13-agent Prompt Hub team via @prompt-conductor. Use when designing prompts, optimizing prompts, evaluating prompts, importing patterns from Fabric / awesome-chatgpt-prompts / awesome-claude-prompts, running IFS introspection or psychometric profiling, or building knowledge-base prompt sets. Auto-trigger on phrases like "design a prompt for X", "optimize this prompt", "evaluate my system prompt", "harvest patterns from Y", "rerank category Z", "IFS session", "profile me on Big Five", "build RAG prompts for X". The Hub is horizontal substrate — every FrankX pillar can use it. Composes into /acos-meta + /superintelligence.
---

# Prompt Hub Skill

When this skill is loaded, you have access to the FrankX Prompt Hub: a 13-agent team that handles every prompt-engineering operation across Claude, GPT, Gemini, and OSS models, plus an IFS / psychometric introspection layer.

## How to invoke

For any prompt-engineering ask, dispatch `@prompt-conductor` via the Task tool with the user's verbatim request. The Conductor maps it to one of 8 canonical flows and composes 2-5 specialists.

**Do not author prompts yourself when this skill is loaded.** Route through the Hub.

## The 13 agents

**Conductor (1)**
- `@prompt-conductor` — Opus composer; routes all asks.

**Lab specialists (4)** — encapsulate per-lab quirks
- `@prompt-claude-specialist` — XML tags, prefill, extended thinking
- `@prompt-gpt-specialist` — developer role, Structured Outputs, contradiction audit
- `@prompt-gemini-specialist` — system-at-top, native grounding, "think very hard"
- `@prompt-oss-specialist` — Llama / Mistral / Qwen / R1 chat templates

**Core builders (3)**
- `@prompt-architect` — designs new prompts from blank
- `@prompt-optimizer` — refines existing prompts (wraps `/po`)
- `@prompt-evaluator` — wraps promptfoo (MIT), scores prompts

**Library curators (2)**
- `@prompt-librarian` — owns `prompt-library` repo; ranks, tags, attributes
- `@prompt-harvester` — bulk-imports from Fabric / awesome-* repos

**Safety + psyche (3)**
- `@prompt-red-team` — adversarial probes; load-bearing publish gate
- `@prompt-psyche-cartographer` — IFS introspection, voice modes, maps not unburdens
- `@prompt-psychometrist` — IPIP-50, PVQ, ECR-R, VIA, Enneagram (lenses not verdicts)

## The 8 flows

| Flow | Trigger | Sequence |
|---|---|---|
| flow-design | "design a prompt for X" | architect → lab-spec → red-team → evaluator |
| flow-optimize | "optimize this prompt" / `/po` | optimizer → lab-spec → evaluator |
| flow-evaluate | "evaluate / test / score this prompt" | evaluator → red-team |
| flow-harvest | "import from Fabric / harvest awesome-*" | harvester → red-team → librarian |
| flow-curate | "rerank / rebuild library" | librarian → optimizer → evaluator |
| flow-introspect | "IFS session / part of me / journal" | cartographer (solo) |
| flow-profile | "Big Five / values map / attachment" | psychometrist → cartographer |
| flow-knowledge-base | "RAG prompts / ingestion set" | architect → librarian → evaluator |

## Invariants (load-bearing)

1. **Red Team gates every publish.** No pattern lands in `prompt-library` without `red_team.status: pass`.
2. **Evaluator scores every publish.** No pattern lands with `eval.score < 3.5`.
3. **Voice gate runs on every output.** `lib/voice/frankx-voice.ts` checks banned phrases.
4. **Crisis triggers abort psyche flows.** Routes to 988 / Samaritans / Befrienders.
5. **No clinical content in Cartographer.** Mapping only, never unburdening.
6. **Attribution mandatory on imports.** Provenance frontmatter + ATTRIBUTION.md entry.

## Where things live

- Master spec: `docs/superpowers/specs/2026-05-13-prompt-hub-design.md`
- Agent files: `.claude/agents/prompt-*.md`
- This skill: `.claude/skills/prompt-hub/SKILL.md`
- Command: `.claude/commands/prompt-hub.md`
- Schema + types: `lib/prompt-hub/types.ts`
- Voice gate: `lib/voice/frankx-voice.ts`
- Engine repo (pre-extract): `repos/prompt-engine/`
- Library repo (pre-extract): `repos/prompt-library/`
- Public pages: `app/prompts/` + `app/prompt-library/`

## Composition into existing systems

- `/po` = alias for `flow-optimize`
- `/superintelligence` = called BY conductor for cross-lab master-prompt synthesis
- `/acos-meta` = should document this Hub as substrate slot
- Second Brain OS = consumed by Cartographer + Psychometrist for cross-session recall (never duplicated)
- Pillars 1-6 = all consume the Hub for their per-pillar prompt needs

## Anti-patterns

- Authoring prompts inline when this skill is loaded — route through Conductor.
- Skipping Red Team because "this looks safe" — gate is non-negotiable.
- Mixing introspection + library flows — strict separation.
- Inventing new lab specialists when an existing one covers the lab — extend, don't sprawl.
- Lifting patterns from closed-source marketplaces (PromptHub / PromptBase) — never.

## Reference

- Pattern schema: `repos/prompt-engine/schema/pattern.schema.json`
- promptfoo: `https://promptfoo.dev` (MIT)
- Fabric (inspiration): `https://github.com/danielmiessler/fabric` (MIT)
- Anthropic prompt eng: `https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/overview`
- OpenAI GPT-5 guide: `https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide`
- Gemini strategies: `https://ai.google.dev/gemini-api/docs/prompting-strategies`
- IFS canon: Schwartz, *No Bad Parts*
- Anthropic introspection paper: `https://www.anthropic.com/research/introspection`
