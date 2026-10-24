'use client'

import { useTransition } from 'react'
import { deletePost } from '@/app/blog/actions'

export function DeleteButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button disabled={pending} onClick={() => startTransition(() => deletePost(postId))}>
      {pending ? 'Deleting…' : 'Delete post'}
    </button>
  )
}
