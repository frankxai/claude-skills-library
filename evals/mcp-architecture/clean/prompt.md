---
description: Precision. A hardened version of the same server; the review must not invent blocking defects.
tags: [mcp, precision, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

We are about to deploy the MCP server in the added `resources` directory (`README.md` explains the setup, `server.ts` is the whole server) so our support agents can use it. Review its design and security before it goes live.

List every defect you would block on. For each, point at the exact tool, resource or line, explain what could go wrong once real agents and real users are on it, and give the specific fix. If there is nothing you would block on, say so plainly.
