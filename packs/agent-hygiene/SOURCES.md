# Sources

Everything in this pack is **estate-native**: re-expressed from contracts already in Frank's repos,
not vendored from a third party. License: MIT, per this repository's LICENSE.

| Piece | Canonical source | Pin |
|---|---|---|
| `agent-hygiene` skill | [`free-skills/agent-hygiene`](../../free-skills/agent-hygiene) | content hash `501b29d52c42` · 2026-10-17 |
| Stop hook, linter, workflow, tests | this directory | authored 2026-10-17 |

## What the skill re-expresses, and from where

| Section of the skill | Source | Date read |
|---|---|---|
| The bar (guardrails, decision discipline, non-waivables) | `Starlight-Intelligence-System/docs/architecture/agents-md/band-a.md` (Band A of the estate `AGENTS.md` contract) and the "Agent hygiene (Karpathy-distilled)" list in that repo's `CLAUDE.md` | 2026-10-17 |
| Agent-file contract, six questions, shape A | `FrankX/docs/acos/agent-template-v2.md` (2026-04-25) and `agentic-creator-os/.claude/agents/meta-agent-quality-auditor.md` (the nine-check rubric) | 2026-10-17 |
| Shape B (write scope, stop conditions, stamp) | `ai-architect/agents/*.md` | 2026-10-17 |
| Shape C (identity card) | `Starlight-Intelligence-System/agents/*.md` | 2026-10-17 |
| Shape D (studio director) | `starlight-agent-skills/agents/*/AGENT.md` | 2026-10-17 |
| Maker is never checker, receipt duty | `gencreator.ai/.claude/agents/gencreator-*.md` (sections "Maker != checker", "Receipt duty") | 2026-10-17 |
| Definite-tell phrase list | the DEFINITE-TELLS subset in `agentic-creator-os`'s `lib/voice/frankx-voice.ts`, as quoted by its quality auditor | 2026-10-17 |
| Skill-file contract | this library's `spec/README.md` and [agentskills.io/specification](https://agentskills.io/specification) | 2026-10-17 |
| Model and effort routing | this library's `free-skills/model-routing` (tiers; model ids last verified 2026-08-28 there) and `starlight-evals/ROUTING-DOCTRINE.md` + `routing-table.json` (measured classes, autonomy boundary A1, sample floor A2) | 2026-10-17 |
| Verification line | the "Verify before claiming" non-waivable in Band A, made into a format a hook can check | 2026-10-17 |

## Decisions made while reconciling

- **Shape-neutral.** The ACOS template's ten numbered sections are one admissible shape, not the
  standard. The linter accepts any heading that answers the six questions, because three of the four
  estate shapes predate the template and are not wrong.
- **Phrases, not words.** The slop list is the definite-tell phrase subset. Single words with
  technical uses (`harness`, `leverage`, `journey`) are deliberately absent; ACOS soft-flags them and
  this linter does not flag them at all. A linter that fires on ordinary prose gets switched off.
- **Canon leak is proper nouns only.** ACOS quarantines `Guardian`, `Gate`, `Realm`, `Sage`. Those are
  ordinary English in an agent file (`voice-guardian`, `quality gates`), so the linter checks the
  names that mean one thing in this estate (Shinkami, Luminor, Arcanean, Godbeast, Malachar, the named
  deities, `Ten Gates`, `Gate of`). It warns rather than errors; the brand owner decides.
- **Missing `model` is warned only where it means something.** A Claude Code subagent or a file that
  declares `tools`. SIS identity cards leave model to the router by design.
- **Missing `description` stays an error** even though 144 SIS cards lack one. It is the only text
  preloaded for routing; a card without it is not dispatchable. The ratchet keeps the debt from
  blocking anyone until the card is touched.

## Not vendored, on purpose

`multica-ai/andrej-karpathy-skills` covers similar ground as one file. Per the strategy page (bet 3)
and `ABSORPTION.md`, Band A already says this in the estate's own voice, so the pack publishes that
rather than absorbing theirs.
