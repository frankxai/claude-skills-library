---
name: copy-desk
description: Audit and rewrite the words on a web page - headline, subhead, CTAs, section copy, microcopy, alt text - so a stranger understands the offer in five seconds and trusts every claim. Use for copy audits, landing page rewrites, "the copy feels generic", hero headlines, CTA wording, conversion clarity, or when studio-scan reports stock vocabulary or unbacked social proof. Works in the repo's own voice, never a house voice.
---

# Copy desk

## Read before writing

1. The repo's voice source: a `COPY.md`, brand pack, `design.md`, or the voice
   section of `AGENTS.md`. If none exists, infer the voice from the three best
   paragraphs already on the site and say that is what you did.
2. The brief from `audience-strategist`: who the buyer is and the job they came
   to do. Copy without a named reader is copy for nobody.
3. The evidence: every number, count, testimonial and "trusted by" must map to a
   source. If it does not, it is cut, not softened.

## The five-second test

Show only the first screen. A stranger should answer three questions:

- What is this?
- Is it for me?
- What do I do next?

Write the answers down as the visitor would say them. If the page does not
produce those answers, the headline and subhead are the fix, before any design work.

## Audit, line by line

For each block, mark one verdict: **keep**, **cut**, **rewrite**, or **prove**
(true but needs evidence on the page). Score the page:

| Check | Pass |
|---|---|
| Headline | a promise or an outcome in the buyer's words, not a brand name |
| Subhead | under 20 words; says how or for whom |
| CTA | a verb plus the thing; one primary per screen |
| Specificity | numbers measured, nouns concrete, verbs the product actually does |
| Claims | each one traceable; none invented to fill a layout |
| Density | no paragraph over 45 words above the fold; scannable headings below |
| Voice | sounds like the brand's own best writing, not a template |

## Rewrite rules

- Lead with the outcome, then the mechanism.
- Cut stock words: seamless, unleash, next-gen, revolutionary, supercharge,
  empower, cutting-edge, game-changer, elevate, unlock. Replace with what the
  thing does.
- No "not X, but Y" constructions, no rhetorical questions as headlines, no
  three-adjective stacks.
- Sentence case for headings, nav and buttons unless the brand system says otherwise.
- Alt text describes what the image shows and why it is there.
- Run the `humanizer` skill on the final copy if it is installed, and keep every claim.

## Deliver

`.studio/<id>/copy.md` with a table per section: current, verdict, proposed,
reason. Then edit only the files the copy chief owns (content, MDX, string
constants). Give the builder anything that changes layout.
