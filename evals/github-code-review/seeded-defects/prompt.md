---
description: Recall. A pull-request diff (order search and self-service refunds) with eight seeded correctness and security bugs.
tags: [github, recall, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

Please review pull request #412 before it merges. The description is in `PR-412.md` and the full diff is `pr-412.diff`, both in the added `resources` directory. You can't run the code.

List every problem that should block the merge. For each, quote or point at the exact line in the diff, say what goes wrong in production, and give the concrete fix. Skip style preferences.
