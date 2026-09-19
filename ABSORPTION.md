# Absorption contract

> How external work enters this library. One rule above the rest:
> **absorption is not registration.** A card or skill that names an upstream without carrying
> its distinguishing knowledge is worse than nothing — it reports coverage you do not have.

**Status:** proposed · **Date:** 2026-09-19 · **Owner:** `agent:starlight-caio` (admission), `agent:starlight-cmo` (claims)

---

## Why this exists

An audit of the Starlight agent fleet on 2026-09-19 found **61 of 151 agent cards (40%) sitting in a
≥85%-identical cluster** — 14 clusters of cards that name different systems and carry the same text.

The sharpest case: ten `starlight-adapter-*` cards, 125 lines each, for agno · autogen · crewai · dify ·
hermes · langgraph · mastra · ollama · openai · paperclip. CrewAI (role-playing crew orchestration) and
LangGraph (cyclical state graphs) are architecturally opposite systems. Their cards differ by **five lines of
substituted nouns**. Seven of the ten name systems absent from the upstream registry entirely.

That is 1,250 lines of registry carrying zero knowledge of any of those ten systems.

This is what absorption looks like without a contract. The failure is not laziness — it is that generating a
card is cheap and reading a codebase is expensive, so absent a gate the cheap thing wins and the registry
inflates. Absorbing *more* before fixing the inbound path just adds more stubs.

---

## What absorption actually means

There are three ways external work can enter, and only one of them is absorption.

| Move | What it is | When it is right |
|---|---|---|
| **Depend** | Pin it as a runtime dependency. Their code, their repo, their release cadence. | The thing is a library and works as one. Default for runtimes. |
| **Absorb** | Take the *pattern*, re-express it in this library's format, carry provenance and license. | The value is encoded expertise — a prompt structure, a checklist, a workflow, a taxonomy. |
| **Adapt** | Write a card that routes to an external system you depend on. | You actually run it. An adapter for a system you have never invoked is a stub. |

**Port the pattern, not the prose.** Copying a file across is not absorption; it inherits their vocabulary,
their assumptions, and their license obligations while producing something that does not compose with anything
here. Absorption means reading it, naming what it knows that we do not, and re-expressing that in the skill
format — with the source credited and the license honoured.

---

## The four gates

`node scripts/absorb.mjs` enforces all four. It refuses rather than warns.

### Gate 1 — License

| Verdict | Licenses |
|---|---|
| **Allowed** | MIT · Apache-2.0 · BSD-2/3-Clause · ISC · CC0-1.0 · CC-BY-4.0 · Unlicense |
| **Refused** | GPL/AGPL/LGPL (copyleft reaches this library's MIT root) · any `-NC` (this library ships commercially) · unlicensed / no LICENSE file · "all rights reserved" |

An unlicensed repo is refused. Public on GitHub is not a license.

### Gate 2 — Provenance

Every absorbed artifact carries a `PROVENANCE.json` naming: source repository, **exact commit SHA**, upstream
path, SPDX license, absorbed date, absorbed-by, and a one-line honest statement of *what changed* in
re-expression. "Reformatted" is not a change statement. "Dropped their retry loop; kept the three-phase
verification sequence; renamed their `crew` to our `swarm`" is.

### Gate 3 — Distinctness

The absorbed skill is checked against every existing skill with the same 5-word-shingle Jaccard test the
estate graph uses. **≥85% similarity is a refusal.** If it is that close to something we have, we already
have it — improve the existing skill instead and credit the upstream there.

This gate is the direct answer to the 61-card finding. It makes the duplicate class un-creatable.

### Gate 4 — Attestation

Carries the `Built on SIP` footer, and passes the skill format validator. Same bar as anything written here.
Absorbed is not a lower tier.

---

## What we never absorb

- **Anything copyleft or non-commercial.** Not "temporarily", not "we'll swap it later".
- **A model's weights, a dataset, or scraped content.** This is a skills library.
- **Secrets, endpoints, or internal hostnames** that happen to be in an upstream's examples.
- **An adapter for a system nobody here has run.** Adapt what you operate; depend on the rest; register the
  ones you are only watching.
- **Their claims.** An upstream's benchmark numbers do not become ours by absorption. CMO's unsourced-claim
  veto applies to absorbed copy exactly as it applies to written copy.

---

## Where the registries split

Two registries, two jobs, no overlap:

- **`Starlight-Intelligence-System/context/empire/upstreams.json`** — the **watch list**. What we track and at
  what adoption level (`candidate` · `conformance` · `lab` · `pattern` · `shadow`). Fifteen entries today.
  Watching is not absorbing.
- **`ABSORBED.md` + `absorbed/*/PROVENANCE.json` here** — the **took list**. What actually entered, from which
  commit, under which license.

An upstream may be watched for a long time and never absorbed. That is a healthy state and the registries
should be able to say so.

---

## The pipeline

```bash
# 1. stage the upstream artifact you have read (not fetched blind)
mkdir -p absorbed/_staging/<domain>/<name> && cp <the file> absorbed/_staging/<domain>/<name>/SKILL.md

# 2. run the gates
node scripts/absorb.mjs \
  --as=<domain>/<name> \
  --from=https://github.com/<owner>/<repo> \
  --commit=<full-sha> \
  --upstream-path=<path/in/their/repo> \
  --license=MIT \
  --changed="what you re-expressed and why" \
  --by="<who>"

# 3. --dry-run first. It prints every gate verdict and writes nothing.
```

Refusal is the default. The script exits non-zero on any failed gate and explains which.

---

## Open queue

Upstreams registered in SIS and **not** absorbed. Each needs a read before it needs a card:

| Upstream | Class | Adoption | The question to answer before absorbing |
|---|---|---|---|
| `openai/agents.md` | standards | conformance | Does our three-band `AGENTS.md` contract conform, and where does it deliberately diverge? |
| `letta-code` | memory_provider | pattern | What does its memory-block model give us that the six vaults do not? |
| `memp` | memory_provider | pattern | Procedural-memory promotion — does it beat our promotion rule? |
| `langgraph` | runtime_dependency | candidate | Depend or adapt. Not both. |
| `mastra` | runtime_dependency | candidate | Same question. |

The seven adapter cards naming untracked systems (agno, autogen, crewai, dify, hermes, ollama, paperclip) are
**not** on this queue. They are on the delete-or-earn list: either someone here runs that system and writes a
real card, or the card goes. Frank rules; an agent does not delete a registered agent.

Built on SIP.
