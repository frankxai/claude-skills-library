# Proposed description fixes (not applied)

Seven of the ten pack skills put their "use when" cue after character 100. Codex (0.164.0) trims every
description evenly once the installed skills overflow its skill-list budget: about 108 characters at 80
installed skills, about 104 at 114 (`receipts/codex-skill-list-budget.md`). On such an install these seven
route on a title and half a sentence. With the 10-skill pack alone, Codex shows them in full. The proposals below move the cue to characters 18–25. They pass `scripts/trigger-lint.mjs`
with 0 errors and keep each skill's scope.

**Why they are not applied yet:** the fix is itself a claim ("the skill fires more reliably"). It
should be measured, not asserted:

1. Run G1 on the current descriptions (`node scripts/eval-skill.mjs <skill> --runs 3`) and record the
   `skill-fired` rate on the should-trigger cases and the fire rate on `no-trigger`.
2. Apply the new description, change nothing else, and run again.
3. Ship the fix only if should-trigger firing rises and no-trigger firing does not. Put both numbers
   on the card.

Caveat: `claude plugin eval` measures Claude Code routing, where descriptions are not cut at 100
characters. The Codex effect needs a Codex-side check (`codex debug prompt-input` shows the cut;
firing needs a Codex run with a model).

| Skill | Cue now → proposed | Length now → proposed | Proposed description |
|---|---|---|---|
| ui-ux-design-expert | 165 → 25 | 279 → 181 | Reviews and designs UIs. Use when auditing accessibility (WCAG 2.2 AA), building a design system or designing an interface: contrast, labels, focus, target size, inclusive patterns. |
| nextjs-expert | 131 → 23 | 260 → 158 | Next.js 16 App Router. Use when building, reviewing or debugging a Next.js app: server vs client components, caching, data fetching, version-specific gotchas. |
| mcp-architecture | 113 → 20 | 232 → 154 | Builds MCP servers. Use when designing, reviewing or securing a Model Context Protocol server: tools, resources, prompts, input schemas, auth and secrets. |
| langgraph-patterns | 135 → 18 | 252 → 153 | LangGraph agents. Use when building or debugging a LangGraph app: state and reducers, routing, tool binding, checkpointing, human-in-the-loop interrupts. |
| skill-builder (**applied 2026-10-24**, see below) | 131 → 21 | 268 → 152 | Writes Agent Skills. Use when creating, reviewing or fixing a SKILL.md: frontmatter, a description that triggers, progressive disclosure, folder layout. |
| product-management-expert | 126 → 20 | 191 → 141 | Product management. Use when writing or reviewing a PRD, roadmap or metric plan: problem evidence, scope, success metrics, rollout and risks. |
| excellence-book-writing | 103 → 18 | 221 → 134 | Nonfiction prose. Use when drafting or revising long-form nonfiction: chapter structure, clarity, narrative flow and editorial polish. |

Library-wide, 75 of 114 skills have the same problem. Fix the pack first, measure it, then decide
whether the rest are worth the same treatment.

**Applied early: skill-builder.** After the G3 P0-2 fix, skill-builder teaches "put the Use-when cue within the first ~100
characters". Leaving its own cue at character 131 would make it break the rule it teaches, so its description was
changed together with that fix. This gives up skill-builder's before/after measurement; the other six fixes stay
unapplied until G1 can measure them.
