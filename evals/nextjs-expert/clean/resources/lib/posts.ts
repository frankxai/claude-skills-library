import 'server-only'
import { db } from '@/lib/db'

export async function getPost(slug: string, opts: { preview: boolean }) {
  return db.post.findFirst({ where: { slug, published: opts.preview ? undefined : true } })
}
