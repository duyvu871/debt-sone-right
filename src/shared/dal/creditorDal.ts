import "server-only";

import { getDefaultTenantId } from "@/lib/tenant";
import { prismaTenant } from "@/shared/dal/prismaTenantClient";

export type CreditorDTO = {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  createdAt: Date;
};

/** Creditor row with debt count (API /api/creditors). */
export type CreditorWithDebtCount = CreditorDTO & { debtCount: number };

export async function listCreditors(): Promise<CreditorDTO[]> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);
  const rows = await prisma.creditor.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    note: c.note,
    createdAt: c.createdAt,
  }));
}

export async function getCreditorById(
  id: string,
): Promise<CreditorDTO | null> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);
  const c = await prisma.creditor.findUnique({ where: { id } });
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    note: c.note,
    createdAt: c.createdAt,
  };
}

export type CreateCreditorInput = {
  name: string;
  phone?: string | null;
  note?: string | null;
};

export async function createCreditor(
  input: CreateCreditorInput,
): Promise<CreditorDTO> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);
  const c = await prisma.creditor.create({
    data: {
      tenantId,
      name: input.name,
      phone: input.phone ?? null,
      note: input.note ?? null,
    },
  });
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    note: c.note,
    createdAt: c.createdAt,
  };
}

export type UpdateCreditorInput = {
  id: string;
  name: string;
  phone?: string | null;
  note?: string | null;
};

export async function updateCreditor(
  input: UpdateCreditorInput,
): Promise<CreditorDTO> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);
  const c = await prisma.creditor.update({
    where: { id: input.id },
    data: {
      name: input.name,
      phone: input.phone ?? null,
      note: input.note ?? null,
    },
  });
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    note: c.note,
    createdAt: c.createdAt,
  };
}

export async function deleteCreditorById(id: string): Promise<void> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);
  await prisma.creditor.delete({ where: { id } });
}
