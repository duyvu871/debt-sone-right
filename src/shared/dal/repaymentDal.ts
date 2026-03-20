import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { getDefaultTenantId } from "@/lib/tenant";
import type { DebtDTO } from "@/shared/dal/debtDal";
import { prismaTenant } from "@/shared/dal/prismaTenantClient";

export type RepaymentRecordDTO = {
  id: string;
  debtId: string;
  happenedAt: Date;
  deltaAmount: string;
  note: string;
  proofUrl: string;
};

export type RepaymentListItemDTO = RepaymentRecordDTO & {
  creditorName: string;
  currency: DebtDTO["currency"];
};

/** Row from GET /api/repayments (includes creditorId for links). */
export type RepaymentListItemWithCreditorId = RepaymentListItemDTO & {
  creditorId: string;
};

export type CreateRepaymentRecordInput = {
  debtId: string;
  happenedAt: Date;
  deltaAmount: string;
  note: string;
  proofUrl: string;
};

function mapRepaymentRow(r: {
  id: string;
  debtId: string;
  happenedAt: Date;
  deltaAmount: { toString: () => string };
  note: string;
  proofUrl: string;
  debt: { creditor: { name: string }; currency: DebtDTO["currency"] };
}): RepaymentListItemDTO {
  return {
    id: r.id,
    debtId: r.debtId,
    happenedAt: r.happenedAt,
    deltaAmount: r.deltaAmount.toString(),
    note: r.note,
    proofUrl: r.proofUrl,
    creditorName: r.debt.creditor.name,
    currency: r.debt.currency,
  };
}

export async function listRepaymentRecords(): Promise<RepaymentListItemDTO[]> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const rows = await prisma.repaymentRecord.findMany({
    orderBy: { happenedAt: "desc" },
    include: { debt: { include: { creditor: true } } },
  });

  return rows.map(mapRepaymentRow);
}

export async function listRepaymentsByDebtId(
  debtId: string,
): Promise<RepaymentListItemDTO[]> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const rows = await prisma.repaymentRecord.findMany({
    where: { debtId },
    orderBy: { happenedAt: "desc" },
    include: { debt: { include: { creditor: true } } },
  });

  return rows.map(mapRepaymentRow);
}

export async function getRepaymentById(
  id: string,
): Promise<RepaymentListItemDTO | null> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const r = await prisma.repaymentRecord.findUnique({
    where: { id },
    include: { debt: { include: { creditor: true } } },
  });

  if (!r) return null;
  return mapRepaymentRow(r);
}

export async function createRepaymentRecord(
  input: CreateRepaymentRecordInput,
): Promise<RepaymentRecordDTO> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const r = await prisma.repaymentRecord.create({
    data: {
      tenantId,
      debtId: input.debtId,
      happenedAt: input.happenedAt,
      deltaAmount: new Prisma.Decimal(input.deltaAmount),
      note: input.note,
      proofUrl: input.proofUrl,
    },
  });

  return {
    id: r.id,
    debtId: r.debtId,
    happenedAt: r.happenedAt,
    deltaAmount: r.deltaAmount.toString(),
    note: r.note,
    proofUrl: r.proofUrl,
  };
}

export type UpdateRepaymentRecordInput = {
  id: string;
  happenedAt: Date;
  deltaAmount: string;
  note: string;
  proofUrl: string;
};

export async function updateRepaymentRecord(
  input: UpdateRepaymentRecordInput,
): Promise<RepaymentRecordDTO> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);

  const r = await prisma.repaymentRecord.update({
    where: { id: input.id },
    data: {
      happenedAt: input.happenedAt,
      deltaAmount: new Prisma.Decimal(input.deltaAmount),
      note: input.note,
      proofUrl: input.proofUrl,
    },
  });

  return {
    id: r.id,
    debtId: r.debtId,
    happenedAt: r.happenedAt,
    deltaAmount: r.deltaAmount.toString(),
    note: r.note,
    proofUrl: r.proofUrl,
  };
}

export async function deleteRepaymentRecordById(id: string): Promise<void> {
  const tenantId = await getDefaultTenantId();
  const prisma = prismaTenant(tenantId);
  await prisma.repaymentRecord.delete({ where: { id } });
}
