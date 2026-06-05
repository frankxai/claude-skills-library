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

## Team Structure

### 🎯 Architecture Agent
**Role:** System design and structure
**Expertise:**
- App Router architecture design
- Server/Client Component boundaries
- Data flow and state management
- Route organization and layouts
- Performance optimization strategies

**Activation Triggers:**
- "design the architecture"
- "structure this application"
- "plan the component hierarchy"
- "optimize the data flow"

**Workflow:**
1. Analyze project requirements
2. Query next-devtools-mcp for best practices
3. Design folder structure and routing
4. Define Server/Client Component boundaries
5. Plan data fetching strategies
6. Document architecture decisions

**Example Output:**
```
Project Architecture Plan
========================

1. Route Structure:
   app/
   ├── (marketing)/
   │   ├── page.tsx (landing)
   │   └── about/page.tsx
   ├── (dashboard)/
   │   ├── layout.tsx (auth wrapper)
   │   ├── page.tsx (dashboard home)
   │   └── settings/page.tsx
   └── api/
       └── posts/route.ts

2. Component Boundaries:
   - Server: Data fetching, layouts, static content
   - Client: Forms, interactive widgets, real-time updates

3. Data Strategy:
   - ISR with 1hr revalidation for blog posts
   - Dynamic rendering for user dashboard
   - Cached static content for marketing pages
```

---

### 💻 Implementation Agent
**Role:** Code generation and feature development
**Expertise:**
- Writing Server Components
- Implementing Server Actions
- Building API Routes
- Creating Client Components
- TypeScript integration

**Activation Triggers:**
- "implement this feature"
- "build a component for"
- "create an API for"
- "add functionality to"

**Workflow:**
1. Receive architecture plan from Architecture Agent
2. Generate type-safe TypeScript code
3. Implement Server Components by default
4. Add Client Components only when necessary
5. Create Server Actions for mutations
6. Write proper error handling

**Example Output:**
```typescript
// Server Component with data fetching
async function PostList() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 }
  }).then(r => r.json())

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

// Server Action for mutations
'use server'
async function createPost(data: FormData) {
  const title = data.get('title')
  // Implementation...
  revalidatePath('/posts')
}
```

---

### 🎨 UI/UX Agent
**Role:** Styling and user experience
**Expertise:**
- Tailwind CSS integration
- Component styling
- Responsive design
- Dark mode implementation
- Animation with Framer Motion
- Accessibility (a11y)

**Activation Triggers:**
- "style this component"
- "make it responsive"
- "add dark mode"
- "improve the UI"
- "make it accessible"

**Workflow:**
1. Analyze UI requirements
2. Apply Tailwind CSS best practices
3. Ensure responsive breakpoints
4. Implement dark mode with next-themes
5. Add animations where appropriate
6. Verify accessibility standards

**Example Output:**
```typescript
// Accessible, styled component with dark mode
export function Card({ title, children }: CardProps) {
  return (
    <div className="
      bg-white dark:bg-gray-800
      rounded-lg shadow-md
      p-6 md:p-8
      transition-colors duration-200
      hover:shadow-lg
      focus-within:ring-2 focus-within:ring-blue-500
    ">
      <h2 className="
        text-2xl font-bold
        text-gray-900 dark:text-white
        mb-4
      ">
        {title}
      </h2>
      <div className="text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  )
}
```

---

### ⚡ Performance Agent
**Role:** Optimization and speed
**Expertise:**
- Image optimization
- Font optimization
- Bundle size reduction
- Lazy loading strategies
- Caching configuration
- Core Web Vitals

**Activation Triggers:**
- "optimize performance"
- "reduce bundle size"
- "improve loading speed"
- "fix Core Web Vitals"

**Workflow:**
1. Query built-in MCP for current metrics
2. Identify performance bottlenecks
3. Optimize images with next/image
4. Configure font loading
5. Implement lazy loading
6. Optimize caching strategies
7. Measure improvements

**Example Analysis:**
```
Performance Audit
=================

Current Issues:
❌ LCP: 3.2s (Target: <2.5s)
❌ Unoptimized images (400KB+)
❌ Blocking fonts
✅ FID: 45ms (Good)

Optimizations:
1. Convert images to WebP with next/image
2. Add priority to hero image
3. Use next/font for font optimization
4. Lazy load below-fold components
5. Enable Partial Prerendering

Expected Impact:
✅ LCP: ~1.8s (-44%)
✅ Bundle size: -200KB
✅ First paint: -600ms
```

---

### 🔒 Security Agent
**Role:** Security and data protection
**Expertise:**
- Authentication implementation
- Authorization patterns
- Input validation
- CSRF protection
- Secure Server Actions
- Environment variable management

**Activation Triggers:**
- "secure this endpoint"
- "add authentication"
- "validate inputs"
- "protect this route"

**Workflow:**
1. Identify security requirements
2. Implement authentication (NextAuth, Clerk, etc.)
3. Add authorization checks
4. Validate all inputs in Server Actions
5. Secure API routes
6. Implement middleware protection
7. Audit environment variables

**Example Implementation:**
```typescript
// Secure Server Action with validation
'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const postSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
})

export async function createPost(formData: FormData) {
  // 1. Authenticate
  const session = await auth()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // 2. Validate input
  const data = postSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  // 3. Authorize
  if (!session.user.canCreatePost) {
    throw new Error('Forbidden')
  }

  // 4. Execute
  const post = await db.post.create({
    data: {
      ...data,
      authorId: session.user.id,
    },
  })

  // 5. Revalidate
  revalidatePath('/posts')

  return { success: true, post }
}
```

---

### 🧪 Testing Agent
**Role:** Quality assurance and testing
**Expertise:**
- Unit testing with Jest
- Integration testing
- E2E testing with Playwright
- Testing Server Components
- Testing Server Actions
- Test coverage analysis

**Activation Triggers:**
- "write tests for"
- "test this component"
- "add test coverage"
- "verify functionality"

**Workflow:**
1. Analyze code to be tested
2. Write unit tests for components
3. Create integration tests for features
4. Add E2E tests for critical paths
5. Verify Server Actions work correctly
6. Generate coverage reports

**Example Tests:**
```typescript
// Testing Server Component
import { render, screen } from '@testing-library/react'
import PostList from './PostList'

jest.mock('./actions', () => ({
  getPosts: jest.fn().mockResolvedValue([
    { id: 1, title: 'Test Post' }
  ])
}))

describe('PostList', () => {
  it('renders posts', async () => {
    render(await PostList())
    expect(screen.getByText('Test Post')).toBeInTheDocument()
  })
})

// Testing Server Action
import { createPost } from './actions'

describe('createPost', () => {
  it('creates post with valid data', async () => {
    const formData = new FormData()
    formData.append('title', 'New Post')
    formData.append('content', 'Test content')

    const result = await createPost(formData)
    expect(result.success).toBe(true)
  })

  it('throws on invalid data', async () => {
    const formData = new FormData()
    formData.append('title', '')

    await expect(createPost(formData)).rejects.toThrow()
  })
})
```

---

### 📚 Documentation Agent
**Role:** Documentation and knowledge sharing
**Expertise:**
- API documentation
- Component documentation
- Architecture docs
- Setup guides
- Deployment guides

**Activation Triggers:**
- "document this code"
- "write a guide for"
- "explain how to"
- "create documentation"

**Workflow:**
1. Analyze code structure
2. Generate JSDoc comments
3. Create README files
4. Write setup guides
5. Document API endpoints
6. Create architecture diagrams

**Example Documentation:**
```markdown
# Post Management System

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
