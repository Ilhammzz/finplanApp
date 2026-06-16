import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Menentukan apakah aplikasi berjalan di Vercel (production) atau di laptop (development)
const isProduction = process.env.NODE_ENV === 'production'

// Jalur cadangan untuk SQLite lokal saat kamu coding di laptop
const localDbPath = `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`

// Inisialisasi LibSQL Client
const libsqlClient = createClient({
  // Di Vercel, jalurnya akan menggunakan libsql:// dari Turso. Di lokal, pakai file:prisma/dev.db
  url: isProduction ? process.env.DATABASE_URL! : localDbPath,
  
  // Token wajib dimasukkan di sini agar koneksi cloud ke Turso diizinkan oleh Vercel
  authToken: isProduction ? process.env.TURSO_AUTH_TOKEN : undefined,
})

// Bungkus dengan adapter Prisma 7
const adapter = new PrismaLibSql({
  url: isProduction ? process.env.DATABASE_URL! : localDbPath,
  authToken: isProduction ? process.env.TURSO_AUTH_TOKEN : undefined,
})

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (!isProduction) globalForPrisma.prisma = db