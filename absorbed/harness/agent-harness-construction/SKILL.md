---
name: agent-harness-construction
description: "Shape an agent's tools, observations, and recovery without adding a second coordinator. Use when defining a tool, a skill, a hook, or a worktree lane."
license: MIT
---

# Build the harness, keep one chair

An agent is a model plus the harness around it. The harness this estate already runs is the guide, the skills, the MCP servers, starlight-memory, the loops, the evals, the permissions, and the receipts. Add a piece only when one of those is missing.

## Lane

- One writer per worktree. Branch `agent/<harness>/<scope>` from `origin/main`.
- Reviewers stay read-only unless they have their own worktree.
- Do not install Oh My OpenAgent, Ruflo, Oh My ClaudeCode, OpenClaw, Paperclip, Orchestrator.inc, or the ECC `full` profile as a coordinator.

## Tools

- Names stay stable. Inputs stay narrow.
- A result names status, a one-line summary, the next action, and the file or id produced.
- An error names a likely cause, one safe retry, and the condition that means stop.

## Context

- The default prompt stays small. Long procedures live in skills that load when asked.
- Point at a file instead of pasting it.
- Compact after the plan is on disk, not in the middle of an edit.

## Where this came from

The action-space checklist follows affaan-m/ECC `skills/agent-harness-construction` at `4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2` (MIT). The one-chair list and the worktree lane are estate law.

Built on SIP.
