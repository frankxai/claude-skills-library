'use client'

import { db } from '@/lib/db'
import { deletePost } from '@/app/blog/actions'

const stripe = { key: process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY }

export function DeleteButton({ postId }: { postId: string }) {
  async function onClick() {
    const post = await db.post.findUnique({ where: { id: postId } })
    if (post?.paid) console.log('refund via', stripe.key)
    await deletePost(postId)
  }
  return <button onClick={onClick}>Delete post</button>
}
