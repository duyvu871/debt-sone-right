/**
 * Seed tối giản — sửa object `MY_SEED` bên dưới rồi chạy:
 *   npx prisma db seed
 * (hoặc `npx prisma migrate reset` nếu muốn xóa DB và seed lại từ đầu.)
 *
 * Chỉ tạo dữ liệu khi organization chưa có chủ nợ nào.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  DebtCurrency,
  DebtStatus,
  Prisma,
  PrismaClient,
} from "../src/generated/prisma/client";

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getConnectionString() }),
});

type SeedRepayment = {
  happenedAt: Date;
  /** Số tiền trả (cùng loại tiền với khoản nợ) */
  deltaAmount: string;
  note: string;
  /** URL chứng từ hoặc để "" */
  proofUrl: string;
};

type SeedDebt = {
  totalAmount: string;
  currency: DebtCurrency;
  occurredAt: Date;
  dueAt: Date;
  status: DebtStatus;
  /** Bỏ hẳn key này hoặc để `[]` nếu chưa trả */
  repayments?: SeedRepayment[];
};

// ─── Điền thông tin của bạn ─────────────────────────────────────────────

const MY_SEED: {
  organizationName: string;
  creditors: {
    name: string;
    phone?: string;
    note?: string;
    debts: SeedDebt[];
  }[];
} = {
  organizationName: "Sổ nợ của tôi",

  creditors: [
    {
      name: "Tên chủ nợ",
      phone: "",
      note: "",
      debts: [
        {
          totalAmount: "10000000.00",
          currency: DebtCurrency.VND,
          occurredAt: new Date("2025-01-15"),
          dueAt: new Date("2025-12-31"),
          status: DebtStatus.OPEN,
          repayments: [
            // {
            //   happenedAt: new Date("2025-02-01"),
            //   deltaAmount: "2000000.00",
            //   note: "Trả một phần",
            //   proofUrl: "",
            // },
          ],
        },
      ],
    },
  ],
};

// ─── Logic seed (không cần sửa thường xuyên) ─────────────────────────────

async function main() {
  let org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: { name: MY_SEED.organizationName },
    });
    console.log("Đã tạo organization:", org.id);
  } else {
    console.log("Đang dùng organization:", org.id);
    if (MY_SEED.organizationName?.trim()) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { name: MY_SEED.organizationName },
      });
    }
  }

  const existingCreditors = await prisma.creditor.count({
    where: { tenantId: org.id },
  });

  if (existingCreditors > 0) {
    console.log(
      `Đã có ${existingCreditors} chủ nợ — bỏ qua seed để không tạo trùng.`,
    );
    console.log(
      "Muốn chạy lại từ đầu: `npx prisma migrate reset` (xóa dữ liệu) rồi seed.",
    );
    return;
  }

  let creditors = 0;
  let debts = 0;
  let repayments = 0;

  for (const c of MY_SEED.creditors) {
    const creditor = await prisma.creditor.create({
      data: {
        tenantId: org.id,
        name: c.name,
        phone: c.phone?.trim() ? c.phone : null,
        note: c.note?.trim() ? c.note : null,
      },
    });
    creditors++;

    for (const d of c.debts) {
      const total = new Prisma.Decimal(d.totalAmount);
      const debt = await prisma.debt.create({
        data: {
          tenantId: org.id,
          creditorId: creditor.id,
          totalAmount: total,
          currency: d.currency,
          occurredAt: d.occurredAt,
          dueAt: d.dueAt,
          status: d.status,
        },
      });
      debts++;

      for (const r of d.repayments ?? []) {
        const amt = new Prisma.Decimal(r.deltaAmount);
        if (amt.lte(0)) continue;
        await prisma.repaymentRecord.create({
          data: {
            tenantId: org.id,
            debtId: debt.id,
            happenedAt: r.happenedAt,
            deltaAmount: amt,
            note: r.note?.trim() ? r.note : "Trả nợ",
            proofUrl: r.proofUrl ?? "",
          },
        });
        repayments++;
      }
    }
  }

  console.log(
    `Xong: ${creditors} chủ nợ, ${debts} khoản nợ, ${repayments} bản ghi trả.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
