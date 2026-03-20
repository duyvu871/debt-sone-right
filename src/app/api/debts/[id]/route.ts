import { getDebtById } from "@/shared/dal/debtDal";
import {
  listRepaymentRecords,
  listRepaymentsByDebtId,
} from "@/shared/dal/repaymentDal";
import { paidByDebtMap } from "@/shared/lib/buildLedgerStats";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const [debt, repaymentsForDebt, allRepayments] = await Promise.all([
      getDebtById(id),
      listRepaymentsByDebtId(id),
      listRepaymentRecords(),
    ]);
    if (!debt) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const paid = paidByDebtMap(allRepayments);
    const repaid = paid.get(debt.id) ?? 0;
    const outstanding = Math.max(0, Number(debt.totalAmount) - repaid);
    return Response.json({
      data: {
        debt,
        outstanding,
        repaid,
        repayments: repaymentsForDebt,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
