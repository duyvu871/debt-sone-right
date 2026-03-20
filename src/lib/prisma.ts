import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

/** When "false" / "0", TLS still runs but server cert chain is not verified (dev / self-signed). */
function sslRejectUnauthorized(): boolean {
  const v = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no") return false;
  return true;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConnectionString();
  const poolConfig = sslRejectUnauthorized()
    ? { connectionString }
    : { connectionString, ssl: { rejectUnauthorized: false } };

  const adapter = new PrismaPg(poolConfig);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
