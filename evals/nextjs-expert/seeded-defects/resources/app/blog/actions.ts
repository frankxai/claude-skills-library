'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } })
  revalidatePath('/blog')
}
