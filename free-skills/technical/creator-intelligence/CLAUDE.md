# Creator Intelligence System

> Transform Claude Code into your personal Jarvis - an AI operating system that knows your projects, preferences, and workflows.

## Purpose

The Creator Intelligence System is the core skill of Agentic Creator OS. It enables you to build a persistent, context-aware AI assistant that operates across all your projects with accumulated knowledge.

## Core Capabilities

### 1. Persistent Memory System
- Project-specific context in CLAUDE.md files
- Cross-session knowledge retention
- Skill auto-activation based on context
- Workflow state preservation

### 2. Department Orchestration
Deploy specialized AI departments for different tasks:

| Department | Focus | MCP Tools |
|------------|-------|-----------|
| Content | Writing, SEO, Publishing | filesystem, browser |
| Dev | Code, Testing, CI/CD | filesystem, database |
| Design | UI/UX, Assets | filesystem, browser |
| Marketing | Social, Email, Ads | email, browser |
| Business | Clients, Finance, Ops | database, email |

### 3. MCP Server Integration
Connect local superpowers through Model Context Protocol:

```yaml
mcpServers:
  filesystem:
    purpose: Read/write project files
    tools: read, write, glob, stat
  database:
    purpose: Persistent state storage
    tools: query, insert, update, delete
  browser:
    purpose: Web automation & screenshots
    tools: navigate, screenshot, click
  email:
    purpose: Automated notifications
    tools: send, draft, template
```

## Implementation Guide

### Step 1: Initialize Your System

Create a root CLAUDE.md in your home directory:

```markdown
# Personal Intelligence System

## Identity
I am [Your Name]'s personal AI operating system.

## Active Projects
- Project A: /path/to/project-a (Next.js app)
- Project B: /path/to/project-b (Python API)

## Preferences
- Code style: Clean, minimal, well-tested
- Communication: Direct, educational
- Output: Production-ready

## Memory
- Key decisions made
- Important context
- Learned preferences
```

### Step 2: Configure Project Context

Each project gets its own CLAUDE.md:

```markdown
# Project: My SaaS App

## Tech Stack
- Next.js 14, TypeScript, Tailwind
- Supabase, Vercel
- Stripe for payments

## Architecture
- /app - Next.js app router
- /lib - Shared utilities
- /components - React components

## Active Tasks
- [ ] Implement auth flow
- [ ] Build dashboard
```

### Step 3: Enable Auto-Activation

Skills activate automatically based on:
- **Keywords**: "content strategy" activates content-strategy skill
- **Files**: Opening `package.json` activates dev skill
- **Commands**: `/soulbook` activates 7-pillars skill

### Step 4: Build Workflows

Create reusable workflows:

```markdown
# Workflow: Blog Publishing

1. **Draft**: Write content in /content/blog/
2. **SEO**: Run /factory-seo optimization
3. **Review**: Check with /factory-qa
4. **Publish**: Deploy to production
5. **Distribute**: Social media automation
```

## Best Practices

### Context Management
- Keep CLAUDE.md files updated with decisions
- Archive old context periodically
- Use consistent formatting for machine parsing

### Skill Development
- Create skills for repeated workflows
- Add triggers for automatic activation
- Document capabilities and examples

### Cross-Project Intelligence
- Reference other projects in context
- Share learned patterns across codebases
- Build reusable components

## Commands

| Command | Description |
|---------|-------------|
| `/creator-intelligence-system` | Initialize or update the system |
| `/agentic-creator-os` | Full system overview |
| `/jarvis` | Quick assistant mode |

## Integration with Other Skills

This skill works with:
- **content-strategy**: For content planning
- **agentic-orchestration**: For multi-agent workflows
- **daily-ops**: For routine automation
- **7-pillars**: For life integration

## Example Session

```
User: Set up my morning ops routine

Claude: I'll create a morning operations workflow that:
1. Checks your content calendar for today's tasks
2. Reviews any overnight notifications
3. Identifies priority work items
4. Prepares your daily dashboard

Creating /workflows/morning-ops.md...
```

---

*Part of [Agentic Creator OS](https://github.com/frankxai/agentic-creator-os)*
