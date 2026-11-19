---
name: to-spec
description: "Turn what has already been discussed into a spec and file it as a GitHub issue on the product repo, without interviewing the user again. Use when the user says write this up as a spec, open an issue for this, or turn this into a ticket, after the decisions are made."
license: MIT
---

# To spec

The conversation already holds the decisions. This skill writes them down once, in the product repo's issue tracker, so the next agent picks up a spec instead of a transcript. It does not ask new questions; if a decision is missing, it is listed as open.

## Before writing

1. **Pick the repo.** The product repo that will change, verified by path, `git rev-parse --show-toplevel` and origin. Never the estate root. Linear is archive unless the user asks for it.
2. **Check for an existing issue.** `gh issue list -R <owner/repo> --search "<keywords>"`. If one tracks this slice, comment the spec there instead of opening a duplicate.
3. **Read the area.** Use the repo's own vocabulary and respect any ADR that covers it.
4. **Name the test seam.** Prefer an existing seam, as high as possible, ideally one. Say it back to the user in one line and continue unless they object.

## The issue body

```
## Problem
What the user faces, in their words.

## Outcome
What is true when this ships, from the user's side.

## User stories
1. As a <actor>, I want <capability>, so that <benefit>.
(Enough to cover the feature, including the failure and empty states.)

## Decisions
Modules touched, interface changes, schema or API contracts, and anything the user decided.
No file paths or code: they rot. Exception: a short prototype snippet that pins a state machine, schema or type more precisely than prose, marked as coming from a prototype.

## Testing
What a good test checks here (behaviour, not internals), which modules get tests, and the prior art in this repo.

## Open
Each decision still missing, tagged [OPEN]. Never fill one with a guess.

## Out of scope
What this does not do.
```

## Rules

- Prose follows the humanizer rules: plain words, no inflated claims, no decorative bold.
- Claims about numbers or live state carry `[MEASURED <method> <date>]` or `[OPEN]`.
- Anything that touches money, auth, data or schema, DNS, legal or external sends is labelled as needing Frank's approval in the Decisions section.
- Label the issue with the repo's ready label if it has one (for example `ready-for-agent`); do not invent labels.
- Reply with the issue URL and one line on what it covers.

## Where this came from

The no-interview synthesis, the single-seam testing advice and the spec sections follow mattpocock/skills `skills/engineering/to-spec` at `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` (MIT). The GitHub-issue-on-the-product-repo rule, the duplicate check, the `[OPEN]` section, the Frank-approval flag and the humanizer requirement are estate rules.

Built on SIP.
