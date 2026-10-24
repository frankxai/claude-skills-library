import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPost } from '@/lib/posts'
import { DeleteButton } from '@/components/DeleteButton'

export default async function PostPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { preview?: string }
}) {
  const session = cookies().get('session')?.value
  const post = await getPost(params.slug, { preview: searchParams.preview === '1' })
  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
      {session ? <DeleteButton postId={post.id} /> : null}
    </article>
  )
}
