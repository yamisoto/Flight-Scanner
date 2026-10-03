import { PrismaClient } from "@prisma/client";

// One Prisma client per server instance. In development, Next.js hot reload
// re-evaluates modules, so the client is cached on globalThis to avoid
// opening a new connection pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set: no database is configured for this environment.");
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}
