import { listCreditors } from "@/shared/dal/creditorDal";
import { listDebts } from "@/shared/dal/debtDal";
import { listRepaymentRecords } from "@/shared/dal/repaymentDal";
import { buildLedgerStats } from "@/shared/lib/buildLedgerStats";

export async function GET() {
  try {
    const [creditors, debts, repayments] = await Promise.all([
      listCreditors(),
      listDebts(),
      listRepaymentRecords(),
    ]);

    const stats = buildLedgerStats(debts, repayments);

    return Response.json({
      data: { creditors, debts, repayments, stats },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
