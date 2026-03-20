import { getCreditorById } from "@/shared/dal/creditorDal";
import { listDebtsByCreditorId } from "@/shared/dal/debtDal";
import { listRepaymentRecords } from "@/shared/dal/repaymentDal";
import { paidByDebtMap } from "@/shared/lib/buildLedgerStats";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const [creditor, debts, repayments] = await Promise.all([
      getCreditorById(id),
      listDebtsByCreditorId(id),
      listRepaymentRecords(),
    ]);
    if (!creditor) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const paid = paidByDebtMap(repayments);
    const debtsWithOutstanding = debts.map((d) => {
      const repaid = paid.get(d.id) ?? 0;
      const outstanding = Math.max(0, Number(d.totalAmount) - repaid);
      return { ...d, outstanding, repaid };
    });
    return Response.json({ data: { creditor, debts: debtsWithOutstanding } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
