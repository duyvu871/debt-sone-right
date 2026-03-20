import { listDebts } from "@/shared/dal/debtDal";
import type { RepaymentListItemWithCreditorId } from "@/shared/dal/repaymentDal";
import { listRepaymentRecords } from "@/shared/dal/repaymentDal";

export async function GET() {
  try {
    const [repayments, debts] = await Promise.all([
      listRepaymentRecords(),
      listDebts(),
    ]);
    const debtById = new Map(debts.map((d) => [d.id, d]));
    const data: RepaymentListItemWithCreditorId[] = repayments.map((r) => {
      const d = debtById.get(r.debtId);
      return {
        ...r,
        creditorId: d?.creditorId ?? "",
      };
    });
    return Response.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
