# The full Next.js 16 upgrade process

> Reference for the `nextjs-upgrade-assistant` skill. See [`../SKILL.md`](../SKILL.md).

## Upgrade Process

### Phase 1: Dependency Upgrade

**Step 1: Update Next.js**
```bash
# Install Next.js 16
npm install next@16 react@latest react-dom@latest

# Or with other package managers
pnpm update next@16 react@latest react-dom@latest
yarn upgrade next@16 react@latest react-dom@latest
```

**Step 2: Update TypeScript (if used)**
```bash
npm install -D typescript@latest @types/react@latest @types/react-dom@latest @types/node@latest
```

**Step 3: Update Related Packages**
```bash
# Update Next.js plugins
npm install -D eslint-config-next@16

# Update common dependencies
npm update @next/mdx autoprefixer tailwindcss
```

### Phase 2: Configuration Updates

**next.config.js/mjs Migration**

Check and update configuration:

```javascript
// Before (Next.js 15)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true, // No longer needed in 16
    serverActions: true, // No longer experimental
  },
}

// After (Next.js 16)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverActions are now stable, remove from experimental
  // appDir is the default, remove this option

  // New Next.js 16 features
  experimental: {
    ppr: true, // Partial Prerendering (optional)
  },
}

export default nextConfig
```

**Key Configuration Changes:**
1. Remove `experimental.appDir` - Now default
2. Remove `experimental.serverActions` - Now stable
3. Consider enabling `experimental.ppr` for Partial Prerendering

### Phase 3: Code Migration

**Server Components (Stable)**

✅ No changes needed - already stable in Next.js 13+

**Server Actions Updates**

```typescript
// Before (Next.js 15)
// Server Actions in experimental phase

// After (Next.js 16)
// Server Actions are stable - no syntax changes needed
// But better type safety and error handling available

'use server'

import { z } from 'zod'

// Enhanced validation and error handling
export async function createPost(formData: FormData) {
  const schema = z.object({
    title: z.string().min(1),
    content: z.string(),
  })

  try {
    const data = schema.parse({
      title: formData.get('title'),
      content: formData.get('content'),
    })

    // Your logic here
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Validation failed' }
  }
}
```

**Metadata API (Enhanced)**

```typescript
// Next.js 16 adds more metadata options

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Page',
  description: 'Page description',

  // New in 16: Better social media support
  openGraph: {
    title: 'My Page',
    description: 'Page description',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'My Page',
      },
    ],
  },

  // Enhanced Twitter/X metadata
  twitter: {
    card: 'summary_large_image',
    title: 'My Page',
    description: 'Page description',
    images: ['/twitter-image.jpg'],
  },
}
```

**Image Optimization Updates**

```typescript
// Enhanced next/image in Next.js 16
import Image from 'next/image'

// New: Better placeholder support
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." // Auto-generated at build
  priority // For LCP images
/>

// New: Better loading states
<Image
  src="/image.jpg"
  alt="Image"
  width={800}
  height={600}
  loading="lazy" // or "eager"
  onLoad={(e) => console.log('Image loaded')}
/>
```

**Font Optimization (No Changes)**

✅ `next/font` API remains the same - already optimal

**Route Handlers (Enhanced)**

```typescript
// app/api/posts/route.ts

import { NextRequest, NextResponse } from 'next/server'

// Next.js 16: Better streaming support
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const customReadable = new ReadableStream({
    async start(controller) {
      const posts = await fetchPosts()
      controller.enqueue(encoder.encode(JSON.stringify(posts)))
      controller.close()
    },
  })

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60',
    },
  })
}
```

### Phase 4: New Features (Optional)

**Partial Prerendering (PPR)**

Enable in next.config.js:
```javascript
const nextConfig = {
  experimental: {
    ppr: true,
  },
}
```

Then mark dynamic segments:
```typescript
// app/posts/[slug]/page.tsx

import { Suspense } from 'react'

export default async function PostPage({ params }) {
  return (
    <div>
      {/* Static shell */}
      <h1>Post Page</h1>

      {/* Dynamic content */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments postId={params.slug} />
      </Suspense>
    </div>
  )
}
```

**Enhanced Caching**

```typescript
// Better cache control in Next.js 16
import { unstable_cache } from 'next/cache'

const getCachedPosts = unstable_cache(
  async () => {
    return await db.post.findMany()
  },
  ['posts'],
  {
    revalidate: 3600,
    tags: ['posts'],
  }
)
```

**Improved Error Handling**

```typescript
// app/error.tsx - Enhanced error boundary

'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Error digest:', error.digest)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Phase 5: Testing & Validation

**Test Checklist:**

1. **Build Test**
   ```bash
   npm run build
   # Check for build errors or warnings
   ```

2. **Dev Server**
   ```bash
   npm run dev
   # Verify all pages load correctly
   ```

3. **Type Checking**
   ```bash
   npm run type-check
   # Ensure no TypeScript errors
   ```

4. **Lint Check**
   ```bash
   npm run lint
   # Fix any new linting issues
   ```

5. **Visual Regression**
   - Check all major pages
   - Verify responsive design
   - Test dark mode (if implemented)
   - Test interactive features

6. **Performance Check**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Verify image optimization
   - Test page load times

7. **Functionality Testing**
   - Test all forms
   - Verify Server Actions
   - Check authentication flows
   - Test API endpoints

### Phase 6: Deployment

**Pre-Deployment:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Final build test
npm run build

# Check bundle size
npm run build -- --analyze # If you have bundle analyzer
```

**Deployment:**
1. Commit all changes
2. Push to repository
3. Deploy to staging first
4. Run smoke tests
5. Deploy to production
6. Monitor error logs
