# Performance, metadata and request interception

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

## Middleware

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
