import { listDebts } from "@/shared/dal/debtDal";
import { getRepaymentById } from "@/shared/dal/repaymentDal";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const [repayment, debts] = await Promise.all([
      getRepaymentById(id),
      listDebts(),
    ]);
    if (!repayment) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const debt = debts.find((d) => d.id === repayment.debtId) ?? null;
    return Response.json({
      data: {
        repayment,
        debt,
        creditorId: debt?.creditorId ?? null,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
