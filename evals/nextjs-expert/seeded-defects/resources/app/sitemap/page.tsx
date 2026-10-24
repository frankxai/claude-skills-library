// Human-readable list of every page, linked from the footer.
import Link from 'next/link'
import { db } from '@/lib/db'

export default async function SitemapPage() {
  const posts = await db.post.findMany({ where: { published: true }, select: { slug: true, title: true } })
  return <ul>{posts.map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>)}</ul>
}
