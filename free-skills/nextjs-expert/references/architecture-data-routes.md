# Architecture, data fetching and route handlers

Part of the `nextjs-expert` skill. SKILL.md links here; read it when structuring an app, choosing how data is fetched and cached, or writing an API route.

## Architecture Patterns

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

## Data Fetching & Caching

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
import { revalidateTag, revalidatePath, updateTag } from 'next/cache'

// Revalidate a tag with stale-while-revalidate. Next.js 16 requires a cacheLife profile as the
// second argument ('max' suits most content); the one-argument form is deprecated.
revalidateTag('posts', 'max')

// Inside a Server Action, when the user must see their own write at once (read-your-writes)
updateTag('posts')

// Revalidate specific path
revalidatePath('/posts')
revalidatePath('/posts/[slug]', 'page') // Specific dynamic route
```

## Route Handlers (API Routes)

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
