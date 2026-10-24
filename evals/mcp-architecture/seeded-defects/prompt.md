---
description: Recall. A remote MCP server for a ticket database with eight seeded security and design defects.
tags: [mcp, recall, should-trigger]
runs: 3
max_turns: 8
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

We are about to deploy the MCP server in the added `resources` directory (`README.md` explains the setup, `server.ts` is the whole server) so our support agents can use it. Review its design and security before it goes live.

List every defect you would block on. For each, point at the exact tool, resource or line, explain what could go wrong once real agents and real users are on it, and give the specific fix.
