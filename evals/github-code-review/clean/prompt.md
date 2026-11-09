---
description: Precision. A correct implementation of the same pull request; the review must not invent blocking problems.
tags: [github, precision, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

Please review pull request #412 before it merges. The description is in `PR-412.md` and the full diff is `pr-412.diff`, both in the added `resources` directory. You can't run the code.

List every problem that should block the merge. For each, quote or point at the exact line in the diff, say what goes wrong in production, and give the concrete fix. If nothing should block the merge, say so plainly. Skip style preferences.
