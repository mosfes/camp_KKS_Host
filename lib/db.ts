import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function databaseUrlWithPoolLimits(rawUrl: string | undefined) {
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);

    // Preview deployments can multiply quickly while sharing the same DB.
    // Keep explicit URL settings unchanged so infrastructure can override this.
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "10");
    }

    return url.toString();
  } catch {
    // Let Prisma report the original connection-string error without exposing it.
    return rawUrl;
  }
}

const databaseUrl = databaseUrlWithPoolLimits(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  (databaseUrl
    ? new PrismaClient({ datasources: { db: { url: databaseUrl } } })
    : new PrismaClient());

globalForPrisma.prisma ??= prisma;
