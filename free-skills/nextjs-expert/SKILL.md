---
name: nextjs-expert
description: Comprehensive Next.js expertise across App Router, server/client boundaries, data and caching patterns, and production operations. Use when building, debugging, or optimizing a Next.js app, deciding server vs client components, or resolving App Router gotchas.
version: 2.1.0
---

# Next.js Expert Skill

**Version:** 2.1 (Next.js 16+ with MCP Integration)
**Author:** FrankX AI Systems
**Last Updated:** 2026-05-13

## When not to use

- Other Node.js servers and frameworks (Express, Fastify, Hono, Remix) or general JavaScript and TypeScript questions with nothing Next.js-specific in them.
- Visual design or accessibility review: use `ui-ux-design-expert`.
- A general pull-request review where Next.js behaviour is not the question: use `github-code-review`.
- Older Pages Router conventions as the target. The guidance here is for the App Router on Next.js 16; older versions differ in exactly the places listed under the gotchas.

## Reference files

Load these only when the task needs them:

- [`references/architecture-data-routes.md`](references/architecture-data-routes.md): Project layout and the server/client component split, fetch caching and revalidation, and route handlers. Read when structuring an app, choosing how data is fetched and cached, or writing an API route.
- [`references/performance-metadata-middleware.md`](references/performance-metadata-middleware.md): Images, fonts, bundles and streaming; metadata and SEO; Proxy (`proxy.ts`, formerly `middleware.ts`). Read when tuning performance, adding metadata or SEO, or intercepting requests.
- [`references/common-patterns.md`](references/common-patterns.md): Loading states, error boundaries, and parallel versus sequential data fetching. Read when adding loading or error UI, or untangling a slow data waterfall.

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

### 4. Renamed or changed in 16 that still runs, with a deprecation warning

- `middleware.ts` is now `proxy.ts`, and the exported function is `proxy`. Proxy runs on Node.js only and is for optimistic redirects, never the only auth check (see `references/performance-metadata-middleware.md`).
- `revalidateTag(tag)` with one argument is deprecated: pass a cacheLife profile, `revalidateTag(tag, 'max')`, or call `updateTag(tag)` inside a Server Action for read-your-writes.

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
- Use Proxy (`proxy.ts`, formerly middleware) only for optimistic redirects; check the session and ownership in the data layer and in every Server Action

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
- Use `revalidatePath`, or `revalidateTag(tag, 'max')` (Next.js 16 requires the profile); in a Server Action, `updateTag(tag)` for read-your-writes
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
