---
name: revenue-protocol
description: Operating rules for the starlight-revenue-team commands - the 30-point rubric, the maker-checker rule, the human gates, and the order work is chosen in. Use when running /today, /ship, /piece, /critic, /demand, /pack or /harvest, or when deciding whether a piece, page or pull request is good enough to ship.
---

# Revenue protocol

The team exists to turn finished work into shipped, measured work. Most estates
build plenty; what they lack is landing it and knowing who would pay. Every
command serves one of those two.

## Order of work

1. Land what is already built (`/ship`). Value that is not merged and live is zero.
2. Capture demand where traffic already is (`/demand`).
3. Make one excellent piece for the brand in rotation (`/piece`).
4. Package and harvest (`/pack`, `/harvest`) when the first three are clear.

One brand at a time. Add the next brand only after the current one holds a score
of 26 or more for two weeks.

## Maker and checker

The provider that made a thing never scores it. `/critic` gets the score from a
different provider (Codex, Gemini or another) and `bin/rubric-check.mjs` marks a
same-provider score `missing-independent`. A relayed review from the maker's own
session is not a sign-off.

## The rubric

Six criteria, each 0 to 5, total 30.

| Criterion | 5 looks like | 0 looks like |
|---|---|---|
| sourceTruth | every claim sourced or the operator's lived experience | one invented number, quote or result |
| saysSomethingNew | beats a named existing piece on one stated dimension | could be any generic AI answer |
| voice | reads like the operator's reference sample | stock AI phrasing |
| readerOutcome | the reader can do one specific thing next | no next action |
| craft | a separate refinement pass with its diff; images carry provenance | first draft handed over |
| brandFit | brand pack and canon intact; native to the channel | breaks a locked canon or a frozen pack |

Ship at 26 or more. Revise at 22 to 25. Restart below 22.

## Human gates

These stop the command and hand the step to a person, every time:

- merging without an independent sign-off on the current head
- publishing, posting, sending, emailing, or scheduling a send
- spending money or running a paid generator
- changing a price, a checkout, or a payment setting
- registering a schedule or cron (print the snippet, never register it)
- deleting a public route or anything with traffic

## Paid tools

Built-in tools first. A metered tool (scraper, SEO suite, enrichment) only after a
named built-in call failed. On a quota or payment error, report it and stop.

## Wiring into an existing collective

When the environment already runs specialist agents, the commands prefer them:
a revenue or marketing lead for `/demand`, a skill foundry for `/pack`, a design
corps for page critique, a polish agent for `/piece`. The plugin's own agents
(`content-critic`, `harvester`, `ship-steward`) are the fallback, so the team
works in a fresh install too.

## Evidence

Every command ends with what it made, what it verified and with which command,
and what waits on a person. A claim about current state needs a check in the
same turn, or it is marked unverified.
