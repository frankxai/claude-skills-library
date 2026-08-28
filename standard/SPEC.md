# Agent Skill Standard — Specification

**Version:** 1.0.0
**Status:** stable
**Builds on:** [Anthropic Agent Skills](https://agentskills.io/specification)

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are used as defined in RFC 2119.

---

## 1. Scope

This specification defines what a conforming **agent skill** contains, and how a skill is assigned a **maturity level** (see [MATURITY-MODEL.md](./MATURITY-MODEL.md)). It does not define what work a skill does, which runtime executes it, or how an organization stores its registry. It is the minimum shared contract that makes a skill portable and trustworthy.

A skill that conforms to the Agent Skills format is, by definition, a conforming skill at **Level 1** of this standard. Everything in this document above L1 is additive and OPTIONAL — a skill is only held to the level it claims.

## 2. The skill folder

A skill MUST be a self-contained directory whose root contains a file named exactly `SKILL.md` (uppercase). The directory name SHOULD match the skill `name`.

```
skill-name/
  SKILL.md          # REQUIRED
  references/       # OPTIONAL — deep docs, loaded on demand
  scripts/          # OPTIONAL — deterministic helpers the agent runs
  assets/           # OPTIONAL — templates used in output
  evals/            # OPTIONAL — scenarios that prove the skill works
```

## 3. The SKILL.md file

### 3.1 Frontmatter

`SKILL.md` MUST begin with a YAML frontmatter block delimited by `---`.

**Required fields (L1):**

| Field | Rule |
|---|---|
| `name` | Lowercase, hyphenated, 1–64 chars, matches `^[a-z0-9][a-z0-9-]*$`. MUST NOT be `anthropic` or `claude`. |
| `description` | Non-empty, ≤ 1024 chars, no XML tags. Third person. MUST state **what the skill does AND when to load it**, with explicit trigger keywords. |

**Governance fields (required for L4):**

| Field | Rule |
|---|---|
| `version` | Semantic version, e.g. `2.3.1`. |
| `owner` | A person or team accountable for the skill. |
| `risk_tier` | One of `T0`–`T4` (see §5). |
| `status` | One of `draft`, `testing`, `approved`, `deprecated`. |
| `rollback` | The last known-good version, e.g. `2.2.4`. |

**Composition fields (required for L5):**

| Field | Rule |
|---|---|
| `composes` | A list of other skill names this skill coordinates with. |
| `attestation` | A short statement of what the skill is built on (e.g. `Built on Agent Skill Standard v1.0`). |
| `boundary` | An explicit statement of what data and actions the skill will and will not touch. |

A conforming validator MUST ignore frontmatter fields it does not recognize.

### 3.2 Body

The body (everything after the frontmatter) MUST describe exactly one workflow. It SHOULD be under 500 lines; longer material MUST move to `references/`. A strong body SHOULD contain:

- a one-sentence **purpose**
- the **required inputs**
- an explicit, numbered **workflow**
- a **quality checklist** the output must pass

The body MUST NOT instruct the agent to perform a deterministic check that a script could perform; such checks SHOULD live in `scripts/`.

## 4. Progressive disclosure

Conforming skills MUST be loadable in three levels:

1. **Metadata** — `name` + `description` only. This is the sole text used for routing.
2. **Body** — the full `SKILL.md`, read only when the skill triggers.
3. **Resources** — `references/`, `scripts/`, `assets/`, pulled in only when needed.

Reference files SHOULD be one level deep and SHOULD carry a short table of contents when over ~100 lines.

## 5. Risk tiers

Every governed skill MUST declare a risk tier. Controls scale with possible harm, not with apparent sophistication.

| Tier | Example | Minimum control |
|---|---|---|
| T0 | Personal productivity | Personal judgment |
| T1 | Internal low-risk | Owner review |
| T2 | Business workflow | Registry + evaluations |
| T3 | Sensitive workflow (customer data, legal, HR, finance) | Security / legal / privacy review |
| T4 | Operational action (production, billing, security response) | Strict approval, logging, rollback |

A skill at T3 or above MUST reach maturity Level 4 before it ships.

## 6. Evaluation

A skill claiming Level 3 or above MUST include an `evals/` directory with at least three scenarios:

1. a clean **success** case,
2. an **incomplete-input** case (the skill should ask, not invent), and
3. a **misuse / boundary** case (the skill should refuse).

Scenarios MUST be re-runnable so a change can be checked against them.

## 7. Conformance

A skill conforms "at Level N" when it satisfies every requirement of Levels 1 through N. The [validator](./validate-skill.mjs) computes the highest level a skill satisfies. See [CONFORMANCE.md](./CONFORMANCE.md).

## 8. Versioning

This specification is versioned with semantic versioning. Breaking changes to required fields increment the major version. The current version is recorded in [`VERSION`](./VERSION) and [`CHANGELOG.md`](./CHANGELOG.md).
