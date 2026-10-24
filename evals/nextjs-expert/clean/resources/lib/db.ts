import 'server-only'
import { PrismaClient } from '@prisma/client'

// Connects with DATABASE_URL (credentials in the connection string).
export const db = new PrismaClient()
