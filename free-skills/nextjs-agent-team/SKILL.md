---
name: nextjs-agent-team
description: Multi-agent workflow for planning, building, testing, and shipping Next.js applications. Use when building a Next.js app end-to-end with a team of specialist agents, or coordinating plan→build→test→ship for a Next.js project.
version: 1.0.0
---

# Next.js Agent Team System

**Version:** 1.0
**Author:** FrankX AI Systems
**Last Updated:** 2025-10-24

## Overview

A specialized team of AI agents for comprehensive Next.js development. Each agent has specific expertise and works together to deliver production-ready Next.js applications.


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/team-structure.md`](references/team-structure.md) — the full agent team structure.

---

## Architecture

This system uses Next.js 16 Server Components and Server Actions for
optimal performance.

## Components

### PostList
Server Component that fetches and displays posts.

**Props:** None
**Data Source:** `/api/posts`
**Caching:** ISR with 1 hour revalidation

### PostForm
Client Component for creating new posts.

**Props:**
- `onSuccess?: () => void` - Callback after successful submission

**Server Action:** `createPost`

## API Routes

### GET /api/posts
Retrieves all published posts.

**Response:**
```json
{
  "posts": [
    { "id": 1, "title": "...", "content": "..." }
  ]
}
```

## Setup

1. Install dependencies: `npm install`
2. Configure database in `.env`
3. Run migrations: `npm run db:migrate`
4. Start dev server: `npm run dev`
```

---

## Team Collaboration Patterns

### Pattern 1: New Feature Development
```
User Request → Architecture Agent (design)
           → Implementation Agent (code)
           → UI/UX Agent (style)
           → Security Agent (secure)
           → Testing Agent (verify)
           → Documentation Agent (document)
```

### Pattern 2: Performance Optimization
```
User Request → Performance Agent (audit)
           → Architecture Agent (redesign if needed)
           → Implementation Agent (refactor)
           → Testing Agent (verify improvements)
```

### Pattern 3: Bug Fix
```
Bug Report → Built-in MCP (inspect runtime)
          → Implementation Agent (fix)
          → Testing Agent (prevent regression)
```

### Pattern 4: Security Audit
```
Audit Request → Security Agent (scan)
             → Implementation Agent (fix issues)
             → Testing Agent (verify)
             → Documentation Agent (update security docs)
```

## Activation Protocol

When this skill is activated, identify which agent(s) are needed based on user request:

1. **Single Agent Tasks:**
   - Directly activate the appropriate agent
   - Agent follows its workflow
   - Reports back to user

2. **Multi-Agent Tasks:**
   - Activate agents in sequence
   - Each agent builds on previous work
   - Final synthesis and delivery

3. **Complex Projects:**
   - Architecture Agent creates plan
   - Other agents implement in parallel where possible
   - Integration and testing at end

## Agent Communication

Agents share context through:
- Architecture decisions
- Code implementations
- Test results
- Documentation updates

Each agent can:
- Query next-devtools-mcp for guidance
- Inspect via built-in MCP (if dev server running)
- Build upon previous agent work
- Flag issues for other agents

## Usage Examples

**Example 1: Build a blog**
```
User: "Build a blog with authentication"

Agents Activated:
1. Architecture Agent → Design route structure, data flow
2. Implementation Agent → Build components and Server Actions
3. Security Agent → Add auth with NextAuth.js
4. UI/UX Agent → Style with Tailwind, add dark mode
5. Testing Agent → Write tests for critical paths
6. Documentation Agent → Create setup guide
```

**Example 2: Optimize existing site**
```
User: "My site is slow, optimize it"

Agents Activated:
1. Performance Agent → Run audit, identify issues
2. Implementation Agent → Refactor per recommendations
3. Testing Agent → Verify no functionality breaks
```

**Example 3: Secure API**
```
User: "Secure my API endpoints"

Agents Activated:
1. Security Agent → Audit endpoints, create security plan
2. Implementation Agent → Add auth checks, input validation
3. Testing Agent → Test security measures
4. Documentation Agent → Update API docs with auth requirements
```

## Best Practices

1. **Always Start with Architecture**
   - Prevents rework
   - Ensures scalability
   - Aligns team on approach

2. **Security by Default**
   - Security Agent reviews all Server Actions
   - Validation on all inputs
   - Auth checks on protected routes

3. **Performance First**
   - Performance Agent monitors metrics
   - Server Components by default
   - Optimize as you build

4. **Test Everything**
   - Testing Agent runs continuously
   - High coverage for critical paths
   - E2E tests for user flows

5. **Document as You Go**
   - Documentation Agent works alongside development
   - Keep docs in sync with code
   - Self-documenting code with TypeScript

## Integration with MCP Servers

All agents leverage:
- **next-devtools-mcp:** For documentation and best practices
- **Built-in Next.js MCP:** For runtime insights (when dev server running)

Agents automatically:
- Query MCPs for guidance
- Monitor application state
- Verify implementations match best practices
- Debug with real-time insights

---

This agent team system provides comprehensive Next.js development capabilities, from initial architecture through deployment and maintenance.
