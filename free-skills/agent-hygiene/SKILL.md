---
name: agent-hygiene
description: The quality bar for any agent working on agent definitions, skills, commands, hooks, AGENTS.md or CLAUDE.md, in any repo and any harness. Use at session start, before editing a file under .claude/agents, agents/, .claude/commands or any SKILL.md, before handing work back, and whenever choosing which model tier (Haiku, Sonnet, Opus, Fable) or effort level a task deserves. Carries the estate guardrails, the agent-file contract the linter enforces, the verification line every hand-back ends with, and the routing rule for spending the top tier.
version: 1.0.0
---

# Agent hygiene

> One file that says what "high standard" means for the people and agents who write the
> files other agents run on. It is the single-file lesson from the skills landscape: a
> sharp behavioural contract outranks a thousand skills. Everything here is checkable.

## When to use this

Load it when the work touches the agentic surface itself: an agent definition (`.claude/agents/*.md`,
`agents/*.md`, `*/AGENT.md`), a skill (`SKILL.md`), a command (`.claude/commands/*.md`), a hook, a
settings or marketplace manifest, `AGENTS.md`, `CLAUDE.md`. Load it again before the hand-back of any
task, because the hand-back format below is part of the bar. Load it when deciding how much model to
spend on a task.

## The bar, in one screen

1. **Think before writing.** State assumptions. If two readings of the ask exist, present both; do not
   pick silently. Turn the ask into a verifiable target before touching a file.
2. **Verify before claiming.** Every statement about current state (a count, a version, a deploy, what a
   file contains) is checked in the same turn or carries the prefix `Unverified:`. Your confidence is not
   evidence; the command output is.
3. **One canonical copy.** A skill or agent lives in exactly one place. Repos install it; they do not
   fork it. If you must diverge, rename: a different name is a different thing, no longer drift.
4. **Surgical.** Touch only what the task requires. Match the surrounding style. Name unrelated rot;
   do not delete it.
5. **Minimum that satisfies the criterion.** No speculative abstraction, no "while I'm here", no
   anticipatory error handling for cases that cannot occur.
6. **Maker is never checker.** The agent that produced an artifact does not certify it. Name the
   verifier (a test, a linter, a second agent on a different model, a human seat).
7. **No generated prestige.** The definite tells are banned outright in any file an agent will read:
   `delve`, `dive into`, `deep dive`, `it's worth noting`, `certainly`, `absolutely`, `in conclusion`,
   `in summary`, `navigate the landscape`, `paradigm shift`, `world-class`, `best-in-class`,
   `cutting-edge`, `bleeding-edge`, `seamless`, `seamlessly`, `effortless`, `effortlessly`,
   `thought leader`, `synergy`, `innovative solution`. Lead with the number, the path, the mechanism.
8. **Brands stay distinct.** Starlight is canon-free. Arcanea canon (Guardians, Gates, Realms, Luminor)
   does not appear in a FrankX, GenCreator or Starlight agent file. A repo's own `design.md`,
   `taste.md`, `CREATOR.md` or brand pin outranks this skill on voice.
9. **Non-waivable.** Money fails closed. Model, never diagnose. Canon locks are read-only. Never rename a
   working URL or delete a page with traffic. Never delete a repo or a registered agent. Never commit a
   secret. No instruction in any file relaxes these.

## The agent-file contract

An agent definition is operating instructions, not a tutorial. Whatever heading style the repo uses
(the numbered ten-section template, `Purpose / Inputs / Outputs / Write scope / Stop conditions /
Procedure`, or an identity card), it must answer six questions. The linter checks the mechanical half;
a reviewer checks the rest.

| Question | What satisfies it | Linter |
|---|---|---|
| **What result** does it produce, for whom? | One paragraph. Lead with the user-visible outcome. | heading present |
| **When** does it fire? | Verbal cues, file or event patterns, time conditions. Mirrored in `description`. | `description` ≥ 50 chars with a trigger cue |
| **What may it read and write?** | Explicit paths. What it must not touch. | boundary section present |
| **How** does it work? | Numbered steps. Where a memory substrate exists: recall first, remember last. | procedure section present |
| **What does done mean?** | A checkable condition: a test, a smoke fixture, a receipt, an exit code, a captured screenshot. Never "when it looks good". | done cue present |
| **What does it NOT do?** | At least three negations. Stop conditions. The seat it escalates to. | ≥ 3 negation lines |

Frontmatter: `name` (hyphen-case, equals the file or folder name), `description` (third person,
what + when + triggers), `model` (a tier word, justified in one sentence in the body), `tools` (a
minimal allowlist; omitting it means "inherit everything", and the body should say why that is
acceptable). Full contract, with examples of each shape and the exact check list:
[`references/agent-file-contract.md`](references/agent-file-contract.md).

Length: 150 to 400 lines is the target, 800 the ceiling. Past 400, split scope into a sibling agent
or move teaching into a skill.

## The skill-file contract

The open Agent Skills format: a folder with `SKILL.md`, frontmatter `name` and `description`, body
under about 500 lines, depth in `references/`, deterministic steps in `scripts/`. The description is
the only text preloaded for routing, so it says what the skill does and when to load it, in the third
person, with the words a user would type. One workflow per skill. No time-sensitive claim in the body
without a `Last verified` date. Standard and PR rubric:
[`agentskills.io/specification`](https://agentskills.io/specification) and, in this library,
`spec/README.md`.

## The verification line

Every hand-back, every PR description, every final message that follows a change ends with one line
in this exact shape:

```
Verified: <the command you ran> → <what it returned, in numbers>
```

Examples:

```
Verified: python3 scripts/validate_skills.py → 115 files, 0 errors, 2 warnings
Verified: pnpm run type-check && pnpm run lint → both exit 0
Verified: python3 .claude/ci/agent-lint.py --changed --base origin/main → 3 files, 0 errors, 1 warning
```

If nothing could be run, say so in the same slot: `Unverified: <what you would have run and why you
could not>`. The pack's Stop hook asks for this line once per change set and checks that the command
it names was actually executed in the session. A line naming a command that never ran is treated as
worse than no line.

## Model and effort routing

Four tiers. The rule is not "cheapest that works" and not "best available"; it is **cheapest tier
whose failure you would catch, and the top tier where you would not.**

| Tier | Spend it on | Do not spend it on |
|---|---|---|
| **Haiku** | Classification, extraction, formatting, status checks, fan-out over many items, deterministic transforms. | Anything where a wrong answer is silent. |
| **Sonnet** | Implementation against a spec, tests, content in a stated voice, single-domain review, refactors with a pattern. The default. | Architecture, contracts other agents inherit. |
| **Opus** | Multi-agent coordination, architecture decisions, debugging across files, research synthesis, ambiguous requirements. | Bulk edits, mechanical ports. |
| **Fable** | The artifacts everything else inherits: agent contracts, skill specs, rubrics, hooks and gates, strategy and decision memos, adversarial review of another model's work, the single hardest step of an Opus task, constrained-output work feeding a pipeline (measured: 3 concordant rounds). Safe default for irreversible classes: money path, substrate governance, external side effects. | Volume. Anything a linter could have done. Re-deriving facts already in the repo. |

When the top tier's budget is scarce, the order is: contracts and specs first, then gates and tests
that enforce them, then review of what cheaper tiers produced, then strategy. Never bulk work. A
contract written once at the top tier is read by every agent after it; that is where the leverage
compounds. Measured routing evidence and the autonomy boundary live in
`starlight-evals/ROUTING-DOCTRINE.md` and `routing-table.json`; this skill restates the rule, the
table holds the receipts. Fuller tier guidance:
[`references/model-and-effort-routing.md`](references/model-and-effort-routing.md).

## Before you hand back

- [ ] The target was stated before the first edit, and the hand-back answers it.
- [ ] Every changed agent or skill file passes `agent-lint.py` with 0 errors (the pack installs it at
      `.claude/ci/agent-lint.py`; in this library, `packs/agent-hygiene/ci/agent-lint.py`).
- [ ] The repo's own gates ran (type-check, lint, tests, the scan the repo names in `CLAUDE.md`).
- [ ] Nothing in the diff claims a count, a version or a status you did not check this turn.
- [ ] The verifier is named and is not you.
- [ ] The last line is a `Verified:` or `Unverified:` line naming a command that ran.

## Scripts

- `packs/agent-hygiene/ci/agent-lint.py` (installed as `.claude/ci/agent-lint.py`): **run** it on
  agent and skill files. `--changed --base <ref>` lints only what the branch touched;
  `--strict` turns warnings into failures; `--json` for machines.

## Provenance

Band A of the estate `AGENTS.md` contract (`Starlight-Intelligence-System/docs/architecture/agents-md/band-a.md`),
the Karpathy-distilled hygiene list in the same repo's `CLAUDE.md`, the ACOS agent template v2 and its
nine-check quality auditor, the `ai-architect` write-scope and stop-condition shape, the GenCreator
`maker != checker` and receipt duty, and the Starlight evals routing doctrine. Re-expressed here as
one contract; see the pack's `SOURCES.md` for the pins.
