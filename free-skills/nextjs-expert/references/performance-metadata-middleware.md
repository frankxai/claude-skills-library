# Performance, metadata and Proxy

Part of the `nextjs-expert` skill. SKILL.md links here; read it when tuning performance, adding metadata or SEO, or intercepting requests.

## Performance Optimization

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

## Metadata & SEO

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

## Proxy (formerly Middleware)

Next.js 16 renamed the `middleware.ts` file to `proxy.ts` and the exported `middleware` function to `proxy`. The old
names are deprecated and will be removed; `npx @next/codemod@canary middleware-to-proxy .` renames both. Proxy runs on
the Node.js runtime only, so an app that needs the Edge runtime keeps `middleware.ts` for now. Sources: the Next.js 16
release post (nextjs.org/blog/next-16) and the version 16 upgrade guide.

**Optimistic auth redirect:**
```typescript
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

Proxy only makes optimistic checks: it reads the cookie and redirects, without querying a database. It is not what
protects data. Verify the session and the user's right to the specific resource as close to the data as possible: in a
server-only Data Access Layer, and again inside every Server Action and route handler, because each one can be called
directly (nextjs.org/docs/app/guides/authentication, nextjs.org/docs/app/guides/data-security).

**Custom headers:**
```typescript
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Custom-Header', 'my-value')
  response.headers.set('X-Frame-Options', 'DENY')

  return response
}
```
