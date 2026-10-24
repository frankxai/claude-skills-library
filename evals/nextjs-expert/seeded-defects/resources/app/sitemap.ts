import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
  return posts.map((p) => ({ url: `https://example.com/blog/${p.slug}`, lastModified: p.updatedAt }))
}
