---
name: feynman-thinking
description: Explains a software architecture, algorithm, or control flow in plain language, using a mental model (inputs, transformation, outputs), a text or ASCII flow diagram, and Socratic questions that expose hidden assumptions, then flags needless abstraction. Use when the user asks to explain something simply, "Feynman style", to build a mental model of a system, to explain an architecture to a junior developer, or to challenge a design for over-engineering. Do not use for mechanical edits (renames, typo fixes, formatting, format conversions), boilerplate config, or when the user asks for code only without an explanation.
metadata:
  version: "2.1.0"
---

# Feynman Thinking

Explain a system so a junior developer could rebuild it from the explanation, then strip out what
does not need to exist. This applies to the request that triggered the skill, not to every later
task in the session.

## Response template

Answer in this order and use these headings:

1. **Problem**: one or two plain sentences. What goes in, what must come out, and what breaks
   without it.
2. **Mental model**: name the exact inputs (payload, file, request), each transformation step, and
   the output state. One concrete analogy at most.
3. **Flow**: a text diagram for anything with two or more steps, files, or state changes:
   ```text
   Client request ──> Auth middleware (verify JWT, attach user_id) ──> Suggestion engine (embed, vector query) ──> Top-K items
   ```
4. **Simplest solution**: the least code that solves the stated problem. Name any layer, flag, or
   interface that exists only for future extension, and say what deleting it would break.
5. **Questions**: two to four Socratic questions from the table below, aimed at assumptions the user
   has not stated.

When the user supplied code, quote the specific function or line each point refers to.

## Socratic questions

| Probe | Question template |
|---|---|
| Hidden assumption | "What are we assuming about the shape of this data that might not hold?" |
| Scope | "If we deleted this helper, what would break? Can it be inlined?" |
| Minimum | "What is the least code that would work, even if it feels too easy?" |
| Tradeoff | "We are buying speed (or memory, or readability) here. What are we paying for it?" |
| Failure | "What happens when this step fails or times out, and who finds out?" |

## Abstraction check

Flag each of these with the line or file it appears in:

- A single-caller pass-through class or wrapper that adds no logic.
- A factory, strategy, or plugin interface with one implementation.
- A config flag or branch that nothing sets.
- A vague verb ("streamline", "leverage", "optimize", "robustify") with no named mechanism. Replace
  it with the operation, for example "batch the 40 inserts into one query".

## Worked example: event-sourced memory vault

**Problem**: two devices edit agent memory offline and sync files through a shared folder. If both
overwrite one SQLite file, one device's edits are lost.

**Mental model**: an append-only `vault.jsonl` is the ledger (one note per line, so concurrent
appends merge cleanly). SQLite FTS5 is a disposable index rebuilt from that file.

**Flow**:

```text
Write: agent note ──> append one line to vault.jsonl
Read:  vault.jsonl (from last byte offset) ──> SQLite FTS5 index ──> BM25 + recency rank ──> top-K snippets
```

**Simplest solution**, before and after:

```javascript
// BEFORE: a factory with one product, and a delegator that adds nothing
class AbstractStorageStrategyFactory {
  createAdapter(type) { return new JsonlAppendDelegator(type); }
}

// AFTER: the mechanism itself
import { appendFileSync } from 'node:fs';
export function appendVaultEntry(jsonlPath, entry) {
  appendFileSync(jsonlPath, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n', 'utf8');
}
```

**Questions**: What happens if two devices append the same note id? Is a full index rebuild cheap
enough at 100,000 lines, or do we need the byte offset?

## Check before sending

- [ ] Every vague verb is replaced by a named operation or data structure.
- [ ] Inputs, transformation, and output are named for each component explained.
- [ ] A text diagram is present for any flow of two or more steps.
- [ ] At least two Socratic questions target assumptions the user did not state.
- [ ] Each flagged abstraction says what breaks if it is removed.
