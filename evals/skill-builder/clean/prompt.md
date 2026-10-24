---
description: Precision. A well-formed skill folder; the review must not invent defects.
tags: [skill, precision, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

A teammate wants to add the skill in `db-migration-check/` (in the added `resources` directory) to our shared skills library for Claude Code and Codex. Review the skill folder before we accept it.

List every problem that would make the skill fail to load, fail to trigger at the right time, behave unpredictably or be unsafe to share. For each, point at the exact field, line or file, explain the consequence, and give the specific fix. If you find no such problem, say so plainly.
