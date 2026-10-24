---
description: Precision. A strong PRD for a scoped version of the same feature; the review must not invent gaps.
tags: [product, precision, should-trigger]
runs: 3
max_turns: 6
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

This PRD (`PRD-team-inbox-ai.md` in the added `resources` directory) is in review and engineering would start Monday. As a senior product reviewer, tell me what has to change before we build.

List each gap that should stop or change the plan. For each, point at the section, explain the risk to the product or the business, and say concretely what the PRD should say instead. If nothing should stop or change the plan, say so plainly; minor suggestions are fine but label them as optional.
