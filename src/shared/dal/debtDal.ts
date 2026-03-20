import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { getDefaultTenantId } from "@/lib/tenant";
import { prismaTenant } from "@/shared/dal/prismaTenantClient";

export type DebtDTO = {
  id: string;
  creditorId: string;
  creditorName: string;
  totalAmount: string;
  currency: "VND" | "USD";
  occurredAt: Date;
  dueAt: Date;
  status: "OPEN" | "COMPLETED" | "OVERDUE";
};

export async function listDebts(): Promise<DebtDTO[]> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const debts = await prisma.debt.findMany({
    include: { creditor: true },
    orderBy: { createdAt: "desc" },
  });

  return debts.map((d) => ({
    id: d.id,
    creditorId: d.creditorId,
    creditorName: d.creditor?.name ?? "",
    totalAmount: d.totalAmount.toString(),
    currency: d.currency,
    occurredAt: d.occurredAt,
    dueAt: d.dueAt,
    status: d.status,
  }));
}

export async function getDebtById(debtId: string): Promise<DebtDTO | null> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const d = await prisma.debt.findUnique({
    where: { id: debtId },
    include: { creditor: true },
  });

  if (!d) return null;

  return {
    id: d.id,
    creditorId: d.creditorId,
    creditorName: d.creditor?.name ?? "",
    totalAmount: d.totalAmount.toString(),
    currency: d.currency,
    occurredAt: d.occurredAt,
    dueAt: d.dueAt,
    status: d.status,
  };
}

export async function listDebtsByCreditorId(
  creditorId: string,
): Promise<DebtDTO[]> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const debts = await prisma.debt.findMany({
    where: { creditorId },
    include: { creditor: true },
    orderBy: { createdAt: "desc" },
  });

  return debts.map((d) => ({
    id: d.id,
    creditorId: d.creditorId,
    creditorName: d.creditor?.name ?? "",
    totalAmount: d.totalAmount.toString(),
    currency: d.currency,
    occurredAt: d.occurredAt,
    dueAt: d.dueAt,
    status: d.status,
  }));
}

export type CreateDebtInput = {
  creditorId: string;
  totalAmount: string;
  currency: DebtDTO["currency"];
  occurredAt: Date;
  dueAt: Date;
  status: DebtDTO["status"];
};

export async function createDebt(input: CreateDebtInput): Promise<DebtDTO> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const d = await prisma.debt.create({
    data: {
      tenantId,
      creditorId: input.creditorId,
      totalAmount: new Prisma.Decimal(input.totalAmount),
      currency: input.currency,
      occurredAt: input.occurredAt,
      dueAt: input.dueAt,
      status: input.status,
    },
  });

  const creditor = await prisma.creditor.findUnique({
    where: { id: input.creditorId },
  });

  return {
    id: d.id,
    creditorId: d.creditorId,
    creditorName: creditor?.name ?? "",
    totalAmount: d.totalAmount.toString(),
    currency: d.currency,
    occurredAt: d.occurredAt,
    dueAt: d.dueAt,
    status: d.status,
  };
}

export type UpdateDebtInput = {
  id: string;
  creditorId: string;
  totalAmount: string;
  currency: DebtDTO["currency"];
  occurredAt: Date;
  dueAt: Date;
  status: DebtDTO["status"];
};

export async function updateDebt(input: UpdateDebtInput): Promise<DebtDTO> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const d = await prisma.debt.update({
    where: { id: input.id },
    data: {
      creditorId: input.creditorId,
      totalAmount: new Prisma.Decimal(input.totalAmount),
      currency: input.currency,
      occurredAt: input.occurredAt,
      dueAt: input.dueAt,
      status: input.status,
    },
  });

  const creditor = await prisma.creditor.findUnique({
    where: { id: input.creditorId },
  });

  return {
    id: d.id,
    creditorId: d.creditorId,
    creditorName: creditor?.name ?? "",
    totalAmount: d.totalAmount.toString(),
    currency: d.currency,
    occurredAt: d.occurredAt,
    dueAt: d.dueAt,
    status: d.status,
  };
}

export async function deleteDebtById(id: string): Promise<void> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);
  await prisma.debt.delete({ where: { id } });
}

export type AppendDebtPrincipalInput = {
  debtId: string;
  additionalAmount: string;
};

/**
 * Tăng số tiền gốc khoản nợ (vay thêm / điều chỉnh tăng).
 * `additionalAmount` phải là số dương; gốc mới = gốc cũ + thêm.
 */
export async function appendDebtPrincipal(
  input: AppendDebtPrincipalInput,
): Promise<DebtDTO> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  let add: Prisma.Decimal;
  try {
    add = new Prisma.Decimal(input.additionalAmount.trim());
  } catch {
    throw new Error("Số tiền bổ sung không hợp lệ.");
  }
  if (add.lte(0)) {
    throw new Error("Số tiền bổ sung phải lớn hơn 0.");
  }

  const existing = await prisma.debt.findUnique({
    where: { id: input.debtId },
    include: { creditor: true },
  });
  if (!existing) {
    throw new Error("Không tìm thấy khoản nợ.");
  }

  const newTotal = existing.totalAmount.add(add);

  const d = await prisma.debt.update({
    where: { id: input.debtId },
    data: { totalAmount: newTotal },
  });

  return {
    id: d.id,
    creditorId: d.creditorId,
    creditorName: existing.creditor?.name ?? "",
    totalAmount: d.totalAmount.toString(),
    currency: d.currency,
    occurredAt: d.occurredAt,
    dueAt: d.dueAt,
    status: d.status,
  };
}
