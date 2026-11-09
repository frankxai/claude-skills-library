# Common patterns: loading, errors and parallel fetching

Part of the `nextjs-expert` skill. SKILL.md links here; read it when adding loading or error UI, or untangling a slow data waterfall.

## Loading States

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

## Error Handling

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

## Parallel & Sequential Data Fetching

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
