---
description: Recall. Pre-launch architecture notes for an LLM support agent with eight seeded architecture flaws.
tags: [ai, recall, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

We launch Support Copilot to all customer accounts next week. `ARCHITECTURE.md` in the added `resources` directory is the current design. Review the architecture before launch.

List every architectural problem that should be fixed before launch. For each, point at the specific part of the design, say what will go wrong at scale or under attack, and give the concrete change.
