---
description: Recall. An Agent Skill folder with eight seeded authoring defects against the Agent Skills specification.
tags: [skill, recall, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

A teammate wants to add the skill in `deploy-helper/` (in the added `resources` directory) to our shared skills library for Claude Code and Codex. Review the skill folder before we accept it.

List every problem that would make the skill fail to load, fail to trigger at the right time, behave unpredictably or be unsafe to share. For each, point at the exact field, line or file, explain the consequence, and give the specific fix.
