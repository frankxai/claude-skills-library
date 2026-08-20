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


## Reference


The full detail lives in `references/` and loads only when needed:

- [`references/upgrade-process.md`](references/upgrade-process.md) — the full Next.js 16 upgrade process.

---

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
