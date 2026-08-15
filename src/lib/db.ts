import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion?: string
}

// Re-instantiate the client if the Prisma generated version changed
// (handles schema updates during development without a full restart).
const PRISMA_VERSION = 'v5-2026-08-14-module-access-overrides'
if (globalForPrisma.prismaVersion !== PRISMA_VERSION) {
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaVersion = PRISMA_VERSION
}

// Determine the DATABASE_URL — use the env var if set, otherwise fall back to
// a local SQLite file. This makes the build work on Vercel (which requires
// DATABASE_URL to be set as an env var, and uses Postgres instead of SQLite).
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'file:/home/z/my-project/db/custom.db'

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL not set — using local SQLite fallback. ' +
    'For Vercel/production, set DATABASE_URL to a Postgres connection string.'
  )
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
