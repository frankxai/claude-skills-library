---
description: Precision. A well-designed version of the same system; the review must not invent blocking problems.
tags: [ai, precision, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

We launch Support Copilot to all customer accounts next week. `ARCHITECTURE.md` in the added `resources` directory is the current design. Review the architecture before launch.

List every architectural problem that should be fixed before launch. For each, point at the specific part of the design, say what will go wrong at scale or under attack, and give the concrete change. If nothing must be fixed before launch, say so plainly.
