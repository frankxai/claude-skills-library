---
name: customer-discovery-synthesis
description: Synthesizes customer interviews into patterns, objections, jobs-to-be-done, risks, and product implications. Use when the user provides interview notes, call transcripts, discovery notes, or asks for customer research synthesis.
version: 2.3.1
owner: Revenue Ops
status: approved
risk_tier: T2
rollback: 2.2.4
---

# Customer Discovery Synthesis

A reference skill at maturity **Level 4 (Governed)**: documented, referenced, evaluated, and carrying the governance frontmatter (`version`, `owner`, `risk_tier`, `status`, `rollback`) the standard requires above risk tier T2.

## Purpose

Turn raw customer conversations into actionable product and go-to-market intelligence.

## Required Inputs

- At least one interview note, transcript, or call summary.
- Target customer segment, if known.
- Current product or offer context, if relevant.

## Workflow

1. Run `scripts/validate-inputs.py` to confirm material was actually provided.
2. Read the source material.
3. Extract direct customer language (quotes), grounded in the source.
4. Cluster pain points and desired outcomes.
5. Separate evidence from interpretation — never blend them.
6. Identify objections, buying triggers, and unresolved questions.
7. Produce the output using the structure below.
8. Run the quality checklist before returning.

For the scoring rubric used in step 4, see [`references/interview-rubric.md`](./references/interview-rubric.md).

## Output Structure

- Executive summary
- Customer language (quotes)
- Pain patterns
- Desired outcomes
- Objections
- Product implications
- Sales implications
- Follow-up questions

## Quality Checklist

- No invented quotes.
- Every claim tied to source evidence.
- Assumptions marked clearly.
- Recommendations separated from observations.
- Follow-up questions are specific.

## Anti-patterns

- Fabricating quotes to fill a thin section.
- Presenting interpretation as if it were direct evidence.
- Synthesizing from zero input instead of asking for material.
