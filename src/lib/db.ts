import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Membuat fallback absolute path yang valid untuk Windows (e.g., file:D:/RnD/fintrack/.../dev.db)
const localDbPath = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`
const databaseUrl = process.env.DATABASE_URL || localDbPath

// Prisma 7 Adapter LibSQL bisa menginisialisasi dirinya sendiri secara internal jika kita berikan objek url
const adapter = new PrismaLibSql({
  url: databaseUrl,
})

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db