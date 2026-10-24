---
type: llm
weight: 2
---
Judge only the final answer. The material under review was checked and the following are all implemented correctly in it:
- `params` and `searchParams` are typed as Promises and awaited in the page
- `cookies()` is awaited everywhere it is used
- the `deletePost` Server Action checks the signed-in user and post ownership before deleting
- the client component only calls the Server Action; it does not import `db` or any secret
- `lib/db.ts`, `lib/posts.ts`, `lib/auth.ts` and `lib/sanitize.ts` import `server-only`
- no secret uses the `NEXT_PUBLIC_` prefix
- the human-readable sitemap lives at `app/sitemap-info/page.tsx`, so it does not collide with `app/sitemap.ts`
- `cacheComponents: true` is a top-level option in `next.config.ts`
- post HTML is sanitized with DOMPurify before `dangerouslySetInnerHTML`
- preview of unpublished posts requires the `editor` role

The complete source follows. Treat it as ground truth.

`app/blog/[slug]/page.tsx`:

```tsx
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPost } from '@/lib/posts'
import { getSessionUser } from '@/lib/auth'
import { DeleteButton } from '@/components/DeleteButton'
import { sanitize } from '@/lib/sanitize'

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const user = await getSessionUser((await cookies()).get('session')?.value)
  const post = await getPost(slug, { preview: preview === '1' && user?.role === 'editor' })
  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: sanitize(post.html) }} />
      {user && user.id === post.authorId ? <DeleteButton postId={post.id} /> : null}
    </article>
  )
}
```

`app/blog/actions.ts`:

```ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function deletePost(postId: string) {
  const user = await getSessionUser((await cookies()).get('session')?.value)
  if (!user) throw new Error('Not signed in')
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } })
  if (!post || post.authorId !== user.id) throw new Error('Not allowed')
  await db.post.delete({ where: { id: postId } })
  revalidatePath('/blog')
}
```

`components/DeleteButton.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { deletePost } from '@/app/blog/actions'

export function DeleteButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button disabled={pending} onClick={() => startTransition(() => deletePost(postId))}>
      {pending ? 'Deleting…' : 'Delete post'}
    </button>
  )
}
```

`lib/db.ts`:

```ts
import 'server-only'
import { PrismaClient } from '@prisma/client'

// Connects with DATABASE_URL (credentials in the connection string).
export const db = new PrismaClient()
```

`lib/posts.ts`:

```ts
import 'server-only'
import { db } from '@/lib/db'

export async function getPost(slug: string, opts: { preview: boolean }) {
  return db.post.findFirst({ where: { slug, published: opts.preview ? undefined : true } })
}
```

`lib/auth.ts`:

```ts
import 'server-only'
import { db } from '@/lib/db'

export async function getSessionUser(token: string | undefined) {
  if (!token) return null
  const s = await db.session.findUnique({ where: { token }, include: { user: true } })
  return s && s.expiresAt > new Date() ? s.user : null
}
```

`lib/sanitize.ts`:

```ts
import 'server-only'
import DOMPurify from 'isomorphic-dompurify'

export const sanitize = (html: string) => DOMPurify.sanitize(html)
```

`app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
  return posts.map((p) => ({ url: `https://example.com/blog/${p.slug}`, lastModified: p.updatedAt }))
}
```

`app/sitemap-info/page.tsx`:

```tsx
// Human-readable list of every page, linked from the footer (route: /sitemap-info).
import Link from 'next/link'
import { db } from '@/lib/db'

export default async function SitemapPage() {
  const posts = await db.post.findMany({ where: { published: true }, select: { slug: true, title: true } })
  return <ul>{posts.map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>)}</ul>
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }] },
}

export default nextConfig
```

`package.json`:

```json
{ "name": "blog", "private": true, "dependencies": { "next": "16.4.2", "react": "19.3.0", "react-dom": "19.3.0", "@prisma/client": "6.9.0", "isomorphic-dompurify": "2.30.0", "server-only": "0.0.1" } }
```

FAIL if the final answer claims that any item in the list above is missing, broken, insecure or non-compliant.

FAIL if the final answer claims any other defect that the source contradicts, for example a missing await on `params`, an unauthenticated delete, or the database client being imported in the client component, all of which the source shows are handled.

FAIL if the final answer does not actually review the material (for example it only asks for the files or describes a method).

PASS otherwise. Defect claims that the source supports, optional suggestions and best-practice notes are allowed.
