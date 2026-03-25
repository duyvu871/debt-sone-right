import {
  deleteDebtById,
  getDebtById,
  updateDebt,
} from "@/shared/dal/debtDal";
import {
  listRepaymentRecords,
  listRepaymentsByDebtId,
} from "@/shared/dal/repaymentDal";
import { paidByDebtMap } from "@/shared/lib/buildLedgerStats";
import { formDataToRecord } from "@/shared/lib/formDataToRecord";
import { mutationRouteErrorResponse } from "@/shared/lib/mutationRouteError";
import { requireMutationSession } from "@/shared/lib/requireMutationSession";
import { updateDebtSchema } from "@/shared/schemas/debt";

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

export async function PATCH(req: Request, ctx: RouteContext) {
  const denied = await requireMutationSession();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const fd = await req.formData();
    const raw = formDataToRecord(fd);
    if (raw.id !== id) {
      return Response.json({ error: "id_mismatch" }, { status: 400 });
    }
    const parsed = updateDebtSchema.parse(raw);
    await updateDebt(parsed);
    return Response.json({ ok: true });
  } catch (e) {
    return mutationRouteErrorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const denied = await requireMutationSession();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    await deleteDebtById(id);
    return Response.json({ ok: true });
  } catch (e) {
    return mutationRouteErrorResponse(e);
  }
}
