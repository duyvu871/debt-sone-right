import { listDebts } from "@/shared/dal/debtDal";
import { listRepaymentRecords } from "@/shared/dal/repaymentDal";
import { paidByDebtMap } from "@/shared/lib/buildLedgerStats";

export async function GET() {
  try {
    const [debts, repayments] = await Promise.all([
      listDebts(),
      listRepaymentRecords(),
    ]);
    const paid = paidByDebtMap(repayments);
    const data = debts.map((d) => {
      const repaid = paid.get(d.id) ?? 0;
      const outstanding = Math.max(0, Number(d.totalAmount) - repaid);
      return { ...d, outstanding, repaid };
    });
    return Response.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
