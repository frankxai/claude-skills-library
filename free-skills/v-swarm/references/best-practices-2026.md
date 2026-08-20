# Next.js + Vercel Best Practices — 2026

Current as of April 2026. Verify against `mcp__claude_ai_Vercel__search_vercel_documentation` for any specific claim before recommending it to the user.

## Table of contents

1. [Next.js 16: what changed](#nextjs-16-what-changed)
2. [Cache Components & PPR](#cache-components--ppr)
3. [Server vs Client Components](#server-vs-client-components)
4. [Data fetching](#data-fetching)
5. [Streaming & Suspense](#streaming--suspense)
6. [Edge runtime](#edge-runtime)
7. [Image optimization](#image-optimization)
8. [Performance patterns](#performance-patterns)
9. [Common antipatterns](#common-antipatterns)

## Next.js 16: what changed

The defining shift in Next.js 16 is **explicit, opt-in caching** via the `'use cache'` directive, replacing the implicit auto-caching that made earlier App Router versions unpredictable.

Key changes:
- **Cache Components** — new model using PPR + `'use cache'` for instant navigation
- **Implicit caching removed** — fetches no longer cached by default; you opt in
- **Build performance** — internal Vercel apps using refined caching APIs report notable improvements in dev productivity on large repos

Source: official [Next.js 16 announcement](https://nextjs.org/blog/next-16) + [use cache directive docs](https://nextjs.org/docs/app/api-reference/directives/use-cache).

## Cache Components & PPR

**Partial Pre-Rendering (PPR)** splits a page into:
- **Static shell** — pre-rendered HTML, served instantly from CDN
- **Dynamic holes** — streamed in via Suspense, computed per-request

**`'use cache'` directive** marks a function/component as cacheable. PPR + `'use cache'` work together: cached parts become the static shell automatically.

### Where to put `'use cache'`

✅ **At the data fetch or component level** — granular control:
```ts
async function getPosts() {
  'use cache'
  return db.posts.findMany()
}
```

❌ **Not at the layout level** — too broad, breaks dynamic per-request data downstream.

### Wrap dynamic parts in Suspense

```tsx
export default function Page() {
  return (
    <>
      <CachedHeader />          {/* in static shell via 'use cache' */}
      <Suspense fallback={<Skeleton />}>
        <UserSpecificContent /> {/* streamed in per-request */}
      </Suspense>
    </>
  )
}
```

## Server vs Client Components

**Default: Server Components.** Only opt into Client (`'use client'`) when you need:
- React hooks (`useState`, `useEffect`, `useReducer`)
- Browser-only APIs (`window`, `localStorage`, `IntersectionObserver`)
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Third-party libraries that depend on the above

### Best practice: push `'use client'` to leaves

Don't mark a whole route Client. Mark the smallest interactive leaf and keep the parent Server. This minimizes JS sent to the browser.

```tsx
// app/page.tsx (Server)
import { LikeButton } from './LikeButton'

export default async function Page() {
  const post = await getPost() // Server fetch
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <LikeButton postId={post.id} /> {/* tiny Client island */}
    </article>
  )
}

// app/LikeButton.tsx (Client)
'use client'
import { useState } from 'react'
export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(!liked)}>{liked ? '♥' : '♡'}</button>
}
```

## Data fetching

### Fetch in components, in parallel

Server Components fetch their own data. No prop drilling, no `getServerSideProps`. Parallel fetches happen automatically when components render in parallel.

```tsx
// Both fetches start at the same time — parallel by default
async function Page() {
  const postsPromise = getPosts()
  const userPromise = getUser()
  const [posts, user] = await Promise.all([postsPromise, userPromise])
  return <Layout posts={posts} user={user} />
}
```

### Static vs dynamic

**Prefer static.** Static pages are cheaper, faster, and CDN-cacheable.

Use `force-dynamic` only when you genuinely need fresh data per request:
```ts
export const dynamic = 'force-dynamic'
```

### Don't double-fetch

If two components need the same data, fetch once at the top and pass down — or use React's `cache()` to memoize within a request.

```ts
import { cache } from 'react'
export const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }))
// Now multiple component calls in the same request hit the DB once.
```

## Streaming & Suspense

Use `<Suspense>` to stream slow parts independently. The user sees the fast parts first; slow parts populate as they finish.

```tsx
<Suspense fallback={<HeaderSkeleton />}>
  <Header />
</Suspense>
<Suspense fallback={<FeedSkeleton />}>
  <Feed />  {/* takes 800ms — streams in last */}
</Suspense>
```

`loading.tsx` at the route level wraps the entire route in Suspense automatically — useful for "show skeleton during navigation" without extra code.

## Edge runtime

> ⚠️ **Outdated as of 2026-02-27.** Per `vercel:knowledge-update`, Edge Functions are no longer recommended. Vercel **Fluid Compute** (the new default) runs in the same regions, costs the same, and supports full Node.js — including native modules, `fs`, and the entire ecosystem. Edge Functions had compatibility issues; Fluid Compute solves them while keeping the latency profile. **Recommendation: do not set `runtime = 'edge'` on new routes.** Use the default Node runtime on Fluid Compute (300s default timeout, Node 24 LTS).

Legacy guidance (kept for context; do not act on it):

~~Use the Edge runtime when the route does simple data transformation, low-latency global response matters more than warm-region speed, and there are no Node-specific deps. `export const runtime = 'edge'`.~~

If you find existing `runtime = 'edge'` declarations in the codebase, leave them alone unless you're explicitly migrating — they still work, but new code should default to Fluid Compute (Node runtime, no `runtime` export needed).

## Image optimization

- Always use `next/image` for raster images. Never `<img src>` for content.
- Set `priority` on the LCP image (typically the hero).
- Use AVIF + WebP — already enabled in FrankX `next.config.mjs`.
- Set `sizes` correctly for responsive layouts; `fill` requires a sized parent.
- Don't put SVGs through `next/image` — use `<svg>` directly.

```tsx
<Image
  src="/hero.png"
  alt="..."
  width={1200}
  height={630}
  priority
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

## Performance patterns

### LCP < 2.5s

- Server-render the LCP element (don't wait for client JS)
- Preload critical fonts: `<link rel="preload" as="font" />`
- Inline above-the-fold critical CSS (Next.js does this automatically with App Router)

### INP < 200ms

- Avoid heavy event handlers — break work into microtasks (`setTimeout 0`, `requestIdleCallback`)
- Don't block the main thread with sync expensive logic
- Consider `useTransition` for non-urgent state updates

### CLS < 0.1

- Reserve space for images (`width`/`height` or `aspect-ratio`)
- Reserve space for ads/embeds with min-height
- Avoid late-injected content above existing content

### Bundle hygiene

- Run `next build` and inspect first-load JS
- Tree-shake icon libraries — import individual icons, not whole packs
- Lazy-load heavy components: `const Editor = dynamic(() => import('./Editor'), { ssr: false })`

## Common antipatterns

❌ **Marking the whole layout `'use client'`** — sends the entire tree to the browser
❌ **`'use cache'` on user-specific data** — caches per-user data globally, leaks data across users
❌ **Fetching in parent and prop-drilling** — prefer parallel component-level fetches
❌ **Using `localStorage` in Server Components** — there is no `window` server-side
❌ **Wrapping intrinsic elements with `'use client'`-only icons (lucide etc.) without need** — icons can render in Server Components fine if their import path is server-safe
❌ **`force-dynamic` on the whole route when only one part is dynamic** — kill the static shell, lose all CDN benefits

## Sources

- [Next.js 16 announcement](https://nextjs.org/blog/next-16)
- [`use cache` directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Vercel Production Checklist](https://vercel.com/docs/production-checklist)
