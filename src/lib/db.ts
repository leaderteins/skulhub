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

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db