import type { CreditorWithDebtCount } from "@/shared/dal/creditorDal";
import { listCreditors } from "@/shared/dal/creditorDal";
import { listDebts } from "@/shared/dal/debtDal";

export async function GET() {
  try {
    const [creditors, debts] = await Promise.all([
      listCreditors(),
      listDebts(),
    ]);
    const countByCreditor = new Map<string, number>();
    for (const d of debts) {
      countByCreditor.set(
        d.creditorId,
        (countByCreditor.get(d.creditorId) ?? 0) + 1,
      );
    }
    const data: CreditorWithDebtCount[] = creditors.map((c) => ({
      ...c,
      debtCount: countByCreditor.get(c.id) ?? 0,
    }));
    return Response.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
