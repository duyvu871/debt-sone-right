import type { DebtDTO } from "@/shared/dal/debtDal";
import type { RepaymentListItemDTO } from "@/shared/dal/repaymentDal";
import type { LedgerStats } from "@/shared/model/ledgerStats";

export function buildLedgerStats(
  debts: DebtDTO[],
  repayments: RepaymentListItemDTO[],
): LedgerStats {
  const repaidByDebt = new Map<string, number>();
  for (const r of repayments) {
    repaidByDebt.set(
      r.debtId,
      (repaidByDebt.get(r.debtId) ?? 0) + Number(r.deltaAmount),
    );
  }

  const byCurrency: LedgerStats["byCurrency"] = {};

  for (const d of debts) {
    const c = d.currency;
    if (!byCurrency[c]) {
      byCurrency[c] = { principal: 0, repaid: 0, outstanding: 0 };
    }
    const principal = Number(d.totalAmount);
    const repaid = repaidByDebt.get(d.id) ?? 0;
    byCurrency[c].principal += principal;
    byCurrency[c].repaid += repaid;
    byCurrency[c].outstanding += Math.max(0, principal - repaid);
  }

  return {
    byCurrency,
    openCount: debts.filter((d) => d.status === "OPEN").length,
    overdueCount: debts.filter((d) => d.status === "OVERDUE").length,
    completedCount: debts.filter((d) => d.status === "COMPLETED").length,
    debtCount: debts.length,
    repaymentCount: repayments.length,
  };
}

/** Sum repaid per debt from repayment rows. */
export function paidByDebtMap(repayments: RepaymentListItemDTO[]) {
  const m = new Map<string, number>();
  for (const r of repayments) {
    m.set(r.debtId, (m.get(r.debtId) ?? 0) + Number(r.deltaAmount));
  }
  return m;
}

export function outstandingForDebt(
  debt: Pick<DebtDTO, "id" | "totalAmount">,
  paidMap: Map<string, number>,
) {
  const p = paidMap.get(debt.id) ?? 0;
  return Math.max(0, Number(debt.totalAmount) - p);
}
