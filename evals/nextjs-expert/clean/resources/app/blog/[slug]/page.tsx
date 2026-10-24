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
