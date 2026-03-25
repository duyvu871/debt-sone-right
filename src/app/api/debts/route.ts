import { createDebt } from "@/shared/dal/debtDal";
import { listDebts } from "@/shared/dal/debtDal";
import { listRepaymentRecords } from "@/shared/dal/repaymentDal";
import { paidByDebtMap } from "@/shared/lib/buildLedgerStats";
import { formDataToRecord } from "@/shared/lib/formDataToRecord";
import { mutationRouteErrorResponse } from "@/shared/lib/mutationRouteError";
import { requireMutationSession } from "@/shared/lib/requireMutationSession";
import { createDebtSchema } from "@/shared/schemas/debt";

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

export async function POST(req: Request) {
  const denied = await requireMutationSession();
  if (denied) return denied;
  try {
    const fd = await req.formData();
    const parsed = createDebtSchema.parse(formDataToRecord(fd));
    await createDebt(parsed);
    return Response.json({ ok: true });
  } catch (e) {
    return mutationRouteErrorResponse(e);
  }
}
