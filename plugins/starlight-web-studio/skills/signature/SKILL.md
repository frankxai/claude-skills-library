---
name: signature
description: Resolve whose taste governs a page before any design decision - the repo's design and taste files, the brand pack they name, the operator's recorded likes and dislikes - and turn it into a short signature brief every studio role reads. Use at the start of any studio route, when a design choice feels arbitrary, when two roles disagree on direction, or when asked to keep a site "on brand" or "in my style".
---

# Signature

Taste is not invented per task. It is resolved, written down once per target,
and read by every role. The studio supplies craft; the brand supplies the signature.

## Resolution order (first found wins on conflict)

1. The operator's words in this session.
2. The target repo: `design.md`, `taste.md`, `DESIGN.md`, `tailwind.config.*` or
   CSS tokens, `AGENTS.md`/`CLAUDE.md` design sections.
3. The brand pack the repo names (for Starlight properties:
   `starlight-design-intelligence/brand-packs/<brand>/` with BRAND, DESIGN, COPY,
   MOTION, TOKENS).
4. The operator's taste ledger, if one exists (Starlight:
   `starlight/ops/TASTE_FEEDBACK_LEDGER.jsonl`); filter rows by brand.
5. Shared standards the repo points to (design taste kernel, motion rubric,
   anti-slop system).
6. This plugin's defaults, last.

Never fill a gap with a guess. A missing brand rule is written as an open
question in the brief and decided by the director.

## The signature brief

`.studio/<id>/signature.md`, under one page:

- **Sources read**, with paths and dates.
- **Type**: families, scale, case rules (for example, all-caps banned except one eyebrow).
- **Colour and material**: token names, surface treatments, what is banned.
- **Composition**: grid, density, the moves this brand makes and the ones it never makes.
- **Motion**: personality, budget, reduced-motion stance.
- **Voice**: three adjectives with one example sentence each, from the brand's own copy.
- **Anti-signature**: the specific tells that would make this page look like
  everyone else's (from the ledger's negative rows and the anti-slop list).
- **Open questions** the brand sources do not answer.

## Recording new taste

When the operator reacts to studio output ("love this serif", "too much purple"),
record it where the repo keeps taste. In the Starlight estate:

```bash
node tools/taste-feedback.mjs record --brand <brand> --category <visual|copy|typography|motion> \
  --polarity <positive|negative> --subject "<what>" --doctrine "<the rule, in their words>"
```

Then update the signature brief so the next role reads it.
