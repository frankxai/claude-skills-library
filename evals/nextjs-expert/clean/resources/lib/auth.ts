import 'server-only'
import { db } from '@/lib/db'

export async function getSessionUser(token: string | undefined) {
  if (!token) return null
  const s = await db.session.findUnique({ where: { token }, include: { user: true } })
  return s && s.expiresAt > new Date() ? s.user : null
}
