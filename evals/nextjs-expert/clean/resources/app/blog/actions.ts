'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function deletePost(postId: string) {
  const user = await getSessionUser((await cookies()).get('session')?.value)
  if (!user) throw new Error('Not signed in')
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } })
  if (!post || post.authorId !== user.id) throw new Error('Not allowed')
  await db.post.delete({ where: { id: postId } })
  revalidatePath('/blog')
}
