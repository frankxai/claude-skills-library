# The full agent team structure

> Reference for the `nextjs-agent-team` skill. See [`../SKILL.md`](../SKILL.md).

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
