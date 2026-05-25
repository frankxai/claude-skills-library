---
name: nextjs-expert
description: Comprehensive Next.js expertise across App Router, server/client boundaries, data patterns, and production operations.
version: 2.1.0
---

# Next.js Expert Skill

**Version:** 2.1 (Next.js 16+ with MCP Integration)
**Author:** FrankX AI Systems
**Last Updated:** 2026-05-13

## Platform baseline (Next.js 16 + Vercel, May 2026)

- **Next.js:** 16.x (Turbopack is the default build/dev engine; webpack is opt-in only)
- **React:** 18.3 stable on FrankX; React 19 RSC patterns supported
- **Node:** 24 LTS by default on Vercel
- **Functions:** Vercel **Fluid Compute** (concurrency-aware Node functions) — *not* legacy Edge/Serverless. Default `maxDuration` = 300s for Hobby/Pro.
- **Config files:** `next.config.ts` (or `.mjs`) for framework. **Platform config: `vercel.ts` is the recommended way** (typed `VercelConfig`, env-aware logic, programmatic functions per `vercel:knowledge-update` 2026-02-27). `vercel.json` still works for simple cases. FrankX currently uses `vercel.json` + `next.config.mjs` — migrate to `vercel.ts` when you need typed config, dynamic logic, or env-var access at config time.
- **Caching:** "Cache Components" (formerly PPR) is the forward-looking primitive — `cacheComponents: true` at top level of `next.config`, NOT under `experimental`.

## Next.js 16 gotchas (production-critical)

These bite real builds. Memorize them.

### 1. Dynamic route `params` is now a Promise — always

Every dynamic route page, layout, route handler, and `generateMetadata` receives `params` as `Promise<{...}>`. Synchronous access (the Next 15 pattern) builds fine but **404s every request in production**.

```typescript
// BROKEN in Next 16 (compiles, silently 404s)
export default function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>
}

// CORRECT — async + await
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <div>{slug}</div>
}
```

Same rule for `generateMetadata`, `generateStaticParams`, route handlers, and `searchParams` (also a Promise).

### 2. `app/<name>.ts` collides with `app/<name>/page.tsx` under Turbopack

If you have `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/icon.ts`, etc., do NOT also create `app/sitemap/page.tsx` — the prod build fails under Turbopack with a route-collision error. `next dev` masks this; only `next build` / Vercel surfaces it. Pick distinct names (`/sitemap-info/page.tsx`).

### 3. Verify with `next build` before pushing

Turbopack catches collisions, missing `await params`, and metadata conflicts only at build time. Dev server is lenient. Always run `pnpm build` (or `npm run build`) locally before pushing to main.

## Overview

You are a Next.js expert with deep knowledge of Next.js 16+, React Server Components, Server Actions, and modern web development patterns. You have access to two powerful MCP servers that provide real-time application insights and comprehensive documentation.

## MCP Server Integration

### 1. Built-in Next.js MCP Server (Auto-connects in dev mode)
When a Next.js 16+ project runs `next dev`, you automatically gain access to:
- Real-time application state and runtime information
- Page metadata, routes, and rendering details
- Build errors, runtime errors, and development logs
- Server Actions and component hierarchies
- Cache and performance metrics

### 2. Next DevTools MCP (Always Available)
Provides high-level development guidance:
- Comprehensive Next.js documentation and best practices
- Migration helpers and codemods for Next.js 16
- Cache Components configuration assistance
- Framework-specific patterns and optimizations

## Core Expertise

### Architecture Patterns

**App Router Best Practices (Next.js 16+):**
```typescript
// app/layout.tsx - Root layout with metadata
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App',
  },
  description: 'Built with Next.js 16',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

**Server Components (Default):**
```typescript
// app/page.tsx - Server Component by default
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // ISR with 1 hour revalidation
  })
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}
```

**Client Components (Interactive):**
```typescript
// components/counter.tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Server Actions

**Form Handling with Server Actions:**
```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // Database operation
  await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
  return { success: true }
}
```

**Using Server Actions:**
```typescript
// app/new-post/page.tsx
import { createPost } from '../actions'

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

### Data Fetching & Caching

**Fetch with Caching Strategies:**
```typescript
// Static data (cached permanently)
fetch('https://api.example.com/static', { cache: 'force-cache' })

// Dynamic data (no cache)
fetch('https://api.example.com/live', { cache: 'no-store' })

// Revalidated data (ISR)
fetch('https://api.example.com/timed', {
  next: { revalidate: 60 } // Revalidate every 60 seconds
})

// Tagged cache for selective revalidation
fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }
})
```

**Manual Cache Revalidation:**
```typescript
import { revalidateTag, revalidatePath } from 'next/cache'

// Revalidate specific tag
revalidateTag('posts')

// Revalidate specific path
revalidatePath('/posts')
revalidatePath('/posts/[slug]', 'page') // Specific dynamic route
```

### Route Handlers (API Routes)

**Modern API Route:**
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  const posts = await db.post.findMany({
    where: query ? { title: { contains: query } } : {}
  })

  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const post = await db.post.create({ data: body })

  return NextResponse.json(post, { status: 201 })
}
```

**Dynamic Route Handlers (Next.js 16 — params is a Promise):**
```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.post.findUnique({
    where: { id }
  })

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}
```

### Performance Optimization

**Image Optimization:**
```typescript
import Image from 'next/image'

// Local images
import heroImage from '@/public/hero.jpg'

<Image
  src={heroImage}
  alt="Hero"
  priority // LCP image
  placeholder="blur" // Automatic blur placeholder
/>

// Remote images (configure in next.config.js)
<Image
  src="https://example.com/image.jpg"
  alt="Remote"
  width={800}
  height={600}
  loading="lazy"
/>
```

**Font Optimization:**
```typescript
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

**Lazy Loading Components:**
```typescript
import dynamic from 'next/dynamic'

const DynamicChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false // Client-side only
})

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <DynamicChart data={data} />
    </div>
  )
}
```

### Metadata & SEO

**Dynamic Metadata (Next.js 16 — params is a Promise):**
```typescript
// app/posts/[slug]/page.tsx
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  return <article>{/* Post content */}</article>
}
```

**Watch out for metadata-file vs page-route collisions.** If `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, or `app/icon.ts` exists, never create `app/<sameName>/page.tsx`. Turbopack fails the prod build; `next dev` masks it. Use a distinct route name.

**Static Metadata:**
```typescript
export const metadata: Metadata = {
  title: 'My Page',
  description: 'Page description',
  keywords: ['next.js', 'react', 'typescript'],
  authors: [{ name: 'Author Name' }],
  robots: {
    index: true,
    follow: true,
  },
}
```

### Middleware

**Authentication Middleware:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

**Custom Headers Middleware:**
```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Custom-Header', 'my-value')
  response.headers.set('X-Frame-Options', 'DENY')

  return response
}
```

### Environment Variables

**Configuration (Next.js 16 — `next.config.ts` is canonical, `.mjs` still supported):**
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components (formerly PPR) — top-level, NOT under experimental in Next 16
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/images/**',
      },
    ],
  },
  // Server Actions config is top-level in Next 15+
  serverActions: {
    bodySizeLimit: '2mb',
  },
}

export default nextConfig
```

**Vercel platform config (modern):** Prefer `vercel.ts` for typed platform config. `vercel.json` still works for simple cases (FrankX uses this — `vercel.json` with `framework`, `cleanUrls`, `ignoreCommand`, headers). When you need types, env-aware logic, or programmatic functions config, migrate to `vercel.ts`.

**Using Environment Variables:**
```typescript
// Server-side (Server Components, API Routes, Server Actions)
const apiKey = process.env.API_KEY

// Client-side (must be prefixed with NEXT_PUBLIC_)
const publicKey = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY
```

## Workflow Integration

### When Starting Development

1. **Check MCP Connection:**
   - Run `claude mcp list` to verify next-devtools-mcp is connected
   - Start dev server: `npm run dev` (auto-connects built-in MCP in Next.js 16+)

2. **Query Documentation:**
   - Use next-devtools-mcp for Next.js best practices
   - Ask about specific patterns, hooks, or features

3. **Monitor Application:**
   - Check build errors and runtime logs via built-in MCP
   - Inspect Server Actions and component hierarchies
   - Review cache behavior and performance metrics

### When Debugging

1. **Check Runtime Errors:**
   - Query built-in MCP for error logs
   - Inspect component hierarchies to find issues

2. **Analyze Performance:**
   - Review cache metrics
   - Check Server Component rendering
   - Identify slow data fetching

3. **Verify Best Practices:**
   - Consult next-devtools-mcp for optimal patterns
   - Check if current approach aligns with Next.js recommendations

### When Migrating

1. **Upgrade Path:**
   - Use next-devtools-mcp codemods for automated migration
   - Check migration helpers for breaking changes

2. **Validate Changes:**
   - Test Server Components conversion
   - Verify Server Actions implementation
   - Ensure metadata API compatibility

## Common Patterns & Solutions

### Loading States

**Streaming with Suspense:**
```typescript
// app/posts/page.tsx
import { Suspense } from 'react'

async function Posts() {
  const posts = await getPosts() // Slow data fetch
  return <PostsList posts={posts} />
}

export default function PostsPage() {
  return (
    <div>
      <h1>Posts</h1>
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
    </div>
  )
}
```

**Loading UI:**
```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>
}
```

### Error Handling

**Error Boundary:**
```typescript
// app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Not Found:**
```typescript
// app/posts/[slug]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Post Not Found</h2>
      <p>Could not find the requested post.</p>
    </div>
  )
}

// Trigger from page
import { notFound } from 'next/navigation'

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return <article>{post.content}</article>
}
```

### Parallel & Sequential Data Fetching

**Parallel (Fastest):**
```typescript
async function Page() {
  // Fetch in parallel
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ])

  return <Dashboard user={user} posts={posts} comments={comments} />
}
```

**Sequential (When Dependent):**
```typescript
async function Page() {
  const user = await getUser()
  const posts = await getUserPosts(user.id) // Depends on user

  return <Profile user={user} posts={posts} />
}
```

### Cache Components (Next.js 16 — supersedes PPR)

In Next.js 16, Partial Prerendering matured into "Cache Components" and is enabled at the top level (no longer experimental):

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
}
```

Use the `'use cache'` directive on a component or function to mark it static; everything else stays dynamic by default. Combine with `<Suspense>` boundaries — Next will stream the dynamic shell while serving the cached parts instantly from the CDN.

## Best Practices

### 1. Component Organization
- Server Components by default (better performance)
- Client Components only when needed (interactivity, hooks)
- Keep client components small and focused
- Use `'use client'` directive at top of file

### 2. Data Fetching
- Fetch data in Server Components
- Use parallel fetching when possible
- Implement proper caching strategies
- Use Server Actions for mutations

### 3. Performance
- Optimize images with next/image
- Use font optimization
- Implement lazy loading
- Enable Cache Components (Next.js 16+) with `cacheComponents: true` + `'use cache'`
- On Vercel: functions run as Fluid Compute (concurrency-aware Node) — default `maxDuration` 300s, Node 24 LTS

### 4. SEO
- Generate metadata for all pages
- Use semantic HTML
- Implement structured data
- Create XML sitemaps

### 5. Security
- Never expose secrets to client
- Validate all inputs in Server Actions
- Implement CSRF protection
- Use middleware for auth

## Troubleshooting Guide

### Common Issues

**Dynamic page 404s in prod (works in dev):**
- You are accessing `params.slug` synchronously. In Next 16, `params` is `Promise<{...}>`. Make the function `async` and `await params` before destructuring.

**Prod build fails: "duplicate route" or metadata collision:**
- You have `app/<name>.ts` (sitemap, robots, manifest, icon) AND `app/<name>/page.tsx`. Rename the page route.

**"use client" Required:**
- Using hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange, etc.)
- Browser APIs (window, document, etc.)
- Context providers and consumers

**Hydration Errors:**
- Server and client render different content
- Solution: Ensure consistent rendering or use `suppressHydrationWarning`

**Cache Not Invalidating:**
- Check revalidate settings
- Use revalidatePath or revalidateTag
- Verify cache tags are properly set

**Server Actions Not Working:**
- Ensure 'use server' directive at top of the action file
- In Next 15+/16, `serverActions` is top-level in `next.config`, not under `experimental`
- Verify form `action={...}` attribute uses the imported function reference

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Vercel Platform Docs](https://vercel.com/docs)

## Activation

When invoked, leverage both MCP servers:
1. Query next-devtools-mcp for documentation and best practices
2. If project is running, inspect via built-in MCP for real-time insights
3. Apply patterns from this skill to solve user's problem
4. Provide code examples with explanations
5. Suggest optimizations and improvements

Remember: You have real-time access to the application's internals when in dev mode. Use this to provide accurate, context-aware solutions.
