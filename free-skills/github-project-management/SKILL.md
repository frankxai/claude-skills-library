---
name: github-project-management
title: GitHub Project Management
version: 2.1.0
category: github
description: GitHub project management with issue tracking, project-board automation, and sprint planning. Use when triaging or organizing issues, automating a project board, planning a sprint, or running release/roadmap coordination on GitHub.
author: Claude Code
tags:
  - github
  - project-management
  - issue-tracking
  - project-boards
  - sprint-planning
  - agile
  - swarm-coordination
difficulty: intermediate
prerequisites:
  - GitHub CLI (gh) installed and authenticated
  - ruv-swarm or claude-flow MCP server configured
  - Repository access permissions
related_skills:
  - github-release-management
  - github-multi-repo
estimated_time: 30-45 minutes
---

# GitHub Project Management

Manage GitHub projects with AI swarm coordination: intelligent issue management, automated
project-board synchronization, and sprint planning. This file holds the core workflow; the
exhaustive command catalog and issue templates live in `references/` and load only when needed.

## When to use

Triaging or organizing issues, wiring a project board to a swarm, decomposing an issue into
subtasks, planning or tracking a sprint, or coordinating a release/roadmap on GitHub.

## Prerequisites

- `gh` (GitHub CLI) installed and authenticated.
- `ruv-swarm` or `claude-flow` available (`npx ruv-swarm ...`).
- Permission to edit issues and projects in the target repo/org.

## Quick start

```bash
# Create a swarm-ready issue
gh issue create \
  --title "Feature: Advanced Authentication" \
  --body "Implement OAuth2 with social login..." \
  --label "enhancement,swarm-ready"

# Initialize a swarm for it
npx claude-flow@alpha hooks pre-task --description "Feature implementation"

# Wire a project board to the swarm (bidirectional)
PROJECT_ID=$(gh project list --owner @me --format json | jq -r '.projects[0].id')
npx ruv-swarm github board-init --project-id "$PROJECT_ID" --sync-mode "bidirectional"
```

## Core workflow

### 1. Issue management & triage

Spin up a small coordination swarm, create a well-structured issue, then orchestrate tracking:

```javascript
mcp__claude-flow__swarm_init { topology: "star", maxAgents: 3 }
mcp__claude-flow__agent_spawn { type: "coordinator", name: "Issue Coordinator" }
mcp__github__create_issue {
  owner: "org", repo: "repository",
  title: "Integration Review: Complete system integration",
  body: "## Objectives\n- [ ] Verify dependencies\n- [ ] Ensure API integration\n- [ ] Validate data systems",
  labels: ["integration", "review", "enhancement"]
}
mcp__claude-flow__task_orchestrate { task: "Monitor and coordinate issue progress", strategy: "adaptive", priority: "medium" }
```

Auto-triage unlabeled issues and decompose large ones into subtask checklists — see
[`references/command-reference.md`](references/command-reference.md) for triage rules,
issue→swarm conversion, decomposition, automated progress comments, and stale-issue handling.

### 2. Project board automation

Connect a swarm to a GitHub Project and let it move cards as work progresses:

```bash
npx ruv-swarm github board-sync --auto-move-cards --update-metadata
npx ruv-swarm github board-auto-assign --strategy "load-balanced" --update-cards
```

Status mapping, custom fields, smart card transitions, bulk operations, and the
`.github/board-sync.yml` config are in [`references/command-reference.md`](references/command-reference.md).

### 3. Sprint planning & analytics

```bash
npx ruv-swarm github sprint-manage --sprint "Sprint 23" --auto-populate --track-velocity
npx ruv-swarm github milestone-track --milestone "v2.0 Release" --predict-completion
```

Agile/kanban board setup, board analytics, KPI tracking, and reporting commands are in the
command reference.

### 4. Advanced coordination

Multi-board and cross-org sync, issue dependencies, epic orchestration, cross-repo coordination,
and team-collaboration automation (work distribution, standups, review coordination) are all
catalogued in [`references/command-reference.md`](references/command-reference.md).

## Issue templates

Ready-to-use templates for integration tasks, bug reports, feature requests, and swarm tasks:
[`references/issue-templates.md`](references/issue-templates.md).

## Best practices

- **Swarm coordination**: initialize a swarm for complex issues; assign specialized agents by
  issue type; post regular automated progress updates.
- **Board organization**: consistent column/label naming across repos; regular grooming;
  well-defined automation rules.
- **Data integrity**: validate bidirectional sync; define conflict-resolution strategy; keep
  audit trails and backups of project data.
- **Labeling**: consistent, priority-based labeling; map agent types to labels; integrate
  milestones for coordination.

## Security & permissions

Validate user permissions before executing issue commands; rate-limit to prevent abuse; log all
swarm operations; respect private-repo settings; secure webhook endpoints for real-time updates.

## Integrates with

- `github-release-management` — coordinate release issues and milestones.
- `github-multi-repo` — multi-repository issue coordination.
