---
name: nextjs-upgrade-assistant
description: Guided Next.js upgrade workflow — version migration, compatibility checks, and safe rollout. Use when upgrading Next.js across major versions, resolving breaking changes, or planning a staged migration.
version: 1.0.0
---

# Next.js Upgrade Assistant

**Version:** 1.0 (Next.js 15 → 16)
**Author:** FrankX AI Systems
**Last Updated:** 2025-10-24

## Overview

Automated assistant for upgrading Next.js projects to version 16, with comprehensive migration support and MCP-powered guidance.

## Pre-Upgrade Checklist

Before starting the upgrade, verify:

- [ ] Project uses Git (for easy rollback)
- [ ] All changes are committed
- [ ] Tests are passing
- [ ] Dependencies are up to date (except Next.js)
- [ ] Node.js version is 18.18.0 or higher
- [ ] Backup of production database (if applicable)

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

## Automated Migration with Codemods

Next.js provides codemods for automated migration:

```bash
# Run Next.js codemods via next-devtools-mcp
npx @next/codemod upgrade

# Specific transformations
npx @next/codemod built-in-next-font .
npx @next/codemod new-link .
npx @next/codemod next-image-to-legacy-image .
```

**Query next-devtools-mcp for migration help:**
- Ask about specific migration patterns
- Request codemod recommendations
- Get examples for new features

## Breaking Changes in Next.js 16

### 1. Removed Features
- `getStaticProps` (use Server Components)
- `getServerSideProps` (use Server Components)
- `getInitialProps` (use Server Components)
- `pages/` directory in new apps (use `app/`)

### 2. Changed Defaults
- Server Components are default (was opt-in)
- `fetch()` caching defaults changed
- Dynamic routes require explicit `generateStaticParams`

### 3. API Changes
- Middleware runtime configuration
- Image component props
- Font optimization syntax

## Common Issues & Solutions

### Issue 1: Build Errors After Upgrade

**Problem:** `Module not found` or `Type errors`

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Issue 2: Hydration Errors

**Problem:** Hydration mismatch warnings

**Solution:**
```typescript
// Ensure consistent rendering
// Bad
<time>{new Date().toString()}</time>

// Good
'use client'
import { useEffect, useState } from 'react'

function ClientTime() {
  const [time, setTime] = useState('')

  useEffect(() => {
    setTime(new Date().toString())
  }, [])

  return <time suppressHydrationWarning>{time}</time>
}
```

### Issue 3: Server Actions Not Working

**Problem:** Server Actions return undefined or errors

**Solution:**
```typescript
// Ensure 'use server' is at the top
'use server'

// Return serializable data only
export async function myAction() {
  // Bad - can't serialize Date objects
  return { date: new Date() }

  // Good - serialize first
  return { date: new Date().toISOString() }
}
```

### Issue 4: Cache Not Invalidating

**Problem:** Data not updating after mutations

**Solution:**
```typescript
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function updatePost(id: string, data: any) {
  await db.post.update({ where: { id }, data })

  // Revalidate specific paths
  revalidatePath(`/posts/${id}`)
  revalidatePath('/posts')

  // Or use tags
  revalidateTag('posts')
}
```

## MCP Integration for Upgrades

### Use next-devtools-mcp for:
- Migration guidance and codemods
- Best practices for new features
- Documentation lookup
- Example code for Next.js 16 patterns

### Use built-in MCP (after upgrade) for:
- Monitoring application state
- Debugging runtime issues
- Inspecting Server Actions
- Analyzing performance

## Post-Upgrade Optimization

After successful upgrade:

1. **Enable New Features**
   - Try Partial Prerendering
   - Use enhanced caching
   - Implement new metadata options

2. **Refactor Old Patterns**
   - Convert Client Components to Server Components where possible
   - Replace fetch with native caching
   - Use Server Actions instead of API routes

3. **Optimize Performance**
   - Review bundle size
   - Optimize images
   - Implement lazy loading
   - Check Core Web Vitals

4. **Update Documentation**
   - Document new patterns used
   - Update setup guides
   - Note any breaking changes for team

## Rollback Plan

If upgrade fails:

```bash
# Revert via Git
git reset --hard HEAD~1

# Or checkout previous commit
git checkout <previous-commit-hash>

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Test
npm run dev
```

## Upgrade Checklist

- [ ] Review breaking changes
- [ ] Update dependencies
- [ ] Update configuration files
- [ ] Run codemods
- [ ] Fix TypeScript errors
- [ ] Fix linting issues
- [ ] Update tests
- [ ] Test locally
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor logs
- [ ] Update documentation

## Success Criteria

Upgrade is successful when:
- ✅ Build completes without errors
- ✅ All tests pass
- ✅ Type checking passes
- ✅ Dev server runs smoothly
- ✅ Production build works
- ✅ Core Web Vitals maintained or improved
- ✅ All features work as expected
- ✅ No console errors or warnings
- ✅ Built-in MCP connects (when dev server running)

## Resources

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [Next.js Codemods](https://nextjs.org/docs/app/building-your-application/upgrading/codemods)
- [Breaking Changes](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)
- Query next-devtools-mcp for specific upgrade help

---

This assistant provides a comprehensive upgrade path from Next.js 15 to 16 with minimal downtime and maximum reliability.
