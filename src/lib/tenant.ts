import "server-only";

import prisma from "@/lib/prisma";

export async function getDefaultTenantId(): Promise<string> {
  const fromEnv = process.env.TENANT_ID?.trim();
  if (fromEnv) return fromEnv;

  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!org) {
    throw new Error(
      "No organization found. Set TENANT_ID in .env or run: npx prisma db seed",
    );
  }

  return org.id;
}
