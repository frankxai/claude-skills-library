# The agent-file contract

What a shippable agent definition contains, independent of which repo template produced it. The
mechanical half is enforced by `agent-lint.py`; the judgment half is the reviewer's. A file that
passes the linter is admissible, not finished.

## Contents

1. Frontmatter
2. The six questions, and how the four estate shapes answer them
3. Voice and brand
4. Length
5. The linter's checks, exactly
6. Two short examples
7. What this contract does not decide

---

## 1. Frontmatter

```yaml
---
name: content-hook-engineer          # hyphen-case; equals the file stem or the folder name
description: Generates ... Use when the user says "write hooks for X", "give me hooks", or when a draft lands at content/scripts/*.md.
model: sonnet                        # haiku | sonnet | opus | fable | inherit
tools: Read, Bash, Write             # minimal allowlist; omit only if the body says why inheriting all is acceptable
---
```

| Field | Rule | Why |
|---|---|---|
| `name` | Required. `^[a-z0-9][a-z0-9-]*$`, ≤ 64 chars, equals the file stem (or the folder name for `*/AGENT.md`). | Dispatch is by name. A name that differs from the file is a second identity to keep in sync. |
| `description` | Required. Third person. What it does, when it fires, the words a user would type. ≥ 50 characters. | The only text preloaded for routing. A description without a trigger cue is a skill that never fires, or fires on everything. |
| `model` | Recommended. One of `haiku`, `sonnet`, `opus`, `fable`, `inherit`. A full model id is allowed when pinned on purpose, never with a date suffix. | Tier words survive model releases; dated ids rot. |
| `tools` | Recommended. Comma string, YAML block list or flow list all parse. Declare only what the procedure uses. | An over-broad allowlist means more permission prompts, a weaker security posture and blurrier triggers. |

Other keys (`color`, `tier`, `domain`, `voice`, `skills`, `hooks`, `priority`, `composes`) are
repo-local and are left alone.

## 2. The six questions

| Question | Shape A: numbered template (ACOS, FrankX, frankx.ai) | Shape B: write-scope (ai-architect) | Shape C: identity card (SIS agents) | Shape D: studio director (starlight-agent-skills) |
|---|---|---|---|---|
| What result, for whom | `## 1. Purpose` | `## Purpose` | `## Identity` | `## Mandate` |
| When it fires | `## 2. Triggers` | (description + `## Procedure` step 0) | `## Activation Triggers` | `## Routing` |
| Read and write scope | `## 3. Inputs` ("must not modify" line) | `## Inputs`, `## Write scope` | `## Vault Access` | `## Shared-state contract` |
| How | `## 4. Process` (recall first, remember last) | `## Procedure` | `## Reasoning Protocol` | `## Pipeline` |
| Done means | `## 7. Smoke eval` | `## Outputs` + `## Stamp` | `## Quality Gates` | `## Guarantees` |
| What it does NOT do | `## 8. Anti-patterns` | `## Stop conditions` | `## What this seat does NOT do` | `## Termination` |

Any of these headings satisfies the linter's section checks. What the linter cannot see, and the
reviewer must:

- The **result** is user-visible, not a description of the mechanism.
- **Done** is a condition a machine or a second agent can evaluate: a fixture that exits 0, a file at a
  path, a receipt, a screenshot set, a count. "Until it reads well" is not a condition.
- The **boundaries** include the seat the agent escalates to when it stops.
- Where the repo has a memory substrate (`lib/acos/memory.mjs`, the six vaults, ReasoningBank), the
  procedure recalls before acting and records after. An agent that does not write memory does not
  compound.
- The agent **does not certify its own output**. The file names its verifier.

## 3. Voice and brand

- The repo's brand register wins: `CREATOR.md`, `design.md`, `taste.md`, or the pinned brand pack.
- The definite tells listed in `SKILL.md` section 7 are errors in an agent file. They are not style
  preferences; they are the words a reader uses to decide the file was generated without care.
- Cross-brand canon is a leak. Arcanea's Guardians, Gates, Realms, Luminor and frequencies belong in
  Arcanea repos and in files whose name begins `arcanea-`. Elsewhere they are a defect.
- Lead with numbers and paths. "Scored 7 of 9 checks" beats "high quality".
- No emoji in agent files unless the repo's register asks for it.

## 4. Length

| Lines | Verdict |
|---|---|
| < 40 | Probably a stub. Does it answer the six questions? |
| 150 to 400 | Target. |
| 400 to 800 | Warning. Split scope or move teaching to a skill. |
| > 800 | Error. |

## 5. The linter's checks, exactly

`agent-lint.py` reads agent files (`.claude/agents/**/*.md`, `agents/**/*.md`, `*.agent.md`,
`*/AGENT.md`) and skill files (`SKILL.md`). Registries, readmes and contracts that live inside agent
directories (`CLAUDE.md`, `AGENTS.md`, `README.md`, `*_REGISTRY.md`, `AGENT_STANDARDIZATION.md`,
`PRODUCT_TEAMS.md`) are skipped by name.

**Errors** (exit 1):

| Id | Check |
|---|---|
| E1 | Frontmatter present and well-formed. |
| E2 | `name` present. |
| E3 | `description` present. |
| E4 | No definite-tell phrase outside code blocks (agent files; a warning in skill files, which may be vendored). |
| E5 | `model` is not a dated or retired id (`claude-3*`, anything ending in `-2024MMDD` or `-2025MMDD`). |
| E6 | Body ≤ 800 lines (agent files). |
| E7 | Skill `name` matches `^[a-z0-9][a-z0-9-]*$` and `description` ≤ 1024 characters. |

**Warnings** (exit 1 only with `--strict`):

| Id | Check |
|---|---|
| W1 | `name` is hyphen-case and equals the file stem or folder name. |
| W2 | `description` ≥ 50 characters and carries a trigger cue (`use when`, `when `, `auto-invoke`, `trigger`, `says`, a glob, or `before`/`after` + an event). |
| W3 | `model` present, and one of the tier words or an undated full id. |
| W4 | `tools` declares `Task` or `Agent` but the body never dispatches (`Agent(`, `Task(`, `dispatch`, `subagent`, `delegate`, `fan out`). |
| W5 | A boundary section exists: a heading matching `anti-pattern`, `does not`, `stop condition`, `boundar`, `termination`, `never`, or at least three negation lines (`does not`, `never`, `refuses`, `must not`, `do not`). |
| W6 | A procedure section exists: a heading matching `process`, `procedure`, `pipeline`, `workflow`, `method`, `steps`, `reasoning protocol`, `how it works`. |
| W7 | A done cue exists somewhere in the body: `test`, `smoke`, `eval`, `verify`, `verified`, `receipt`, `exit 0`, `evidence`, `quality gate`, `guarantee`, `acceptance`. |
| W8 | Arcanea canon vocabulary in a file that is not in an Arcanea repo and whose name does not start with `arcanea-`. |
| W9 | Body between 400 and 800 lines (agent files); over 500 lines (skill files). |
| W10 | CRLF line endings. |

Scope flags: `--changed [--base <ref>]` lints only the files the branch touched, which is how the CI
workflow runs it, so existing debt never blocks a PR that did not touch it. `--all` walks the whole
repo for an inventory. `--json` emits one object per file.

## 6. Two short examples

A file that passes with no warnings, shape B:

```markdown
---
name: blue-team
description: Reviews a proposed architecture for the failure modes the author did not list. Use when the user says "red-team this design", "what breaks", or before an ADR is marked accepted.
model: opus
tools: Read, Grep, Glob
---

## Purpose
Return the ranked list of ways the design fails under load, under attack, and under a wrong
assumption, each with the evidence line in the document that triggered it.

## Inputs
`docs/architecture/*.md`. Read-only.

## Write scope
`docs/architecture/reviews/<date>-blue-team.md`. Nothing else.

## Procedure
1. Read the ADR and list every stated assumption.
2. For each, write the condition under which it is false and what fails first.
3. Rank by blast radius. Cite the line.

## Stop conditions
Does not propose the fix. Does not edit the ADR. Does not run when the ADR has no stated
assumptions; it returns "no assumptions to test" and stops. Escalates to the principal architect.

## Done means
The review file exists, every finding cites a line, and `npm run artifacts` exits 0.

Model choice: Opus, because the task is adversarial reasoning over a long document and a miss is
silent.
```

A file that fails:

```markdown
---
name: Content Strategist
description: Helps with content.
---
# Content strategist
Our world-class, cutting-edge strategist will seamlessly delve into your content needs...
```

E4 (three definite tells), W1 (name not hyphen-case), W2 (description under 50 characters, no cue),
W3 (no model), W5, W6, W7 (no boundaries, procedure or done cue).

## 7. What this contract does not decide

- Which heading style a repo uses. Shapes A to D are all admissible.
- Whether an agent should exist. That is the roster owner's call (`general-chro` in ACOS, the SIS
  registry elsewhere) and rests on audit evidence.
- The repo's voice. The brand pin wins.
