import { listDebts } from "@/shared/dal/debtDal";
import type { RepaymentListItemWithCreditorId } from "@/shared/dal/repaymentDal";
import {
  createRepaymentRecord,
  listRepaymentRecords,
} from "@/shared/dal/repaymentDal";
import { formDataToRecord } from "@/shared/lib/formDataToRecord";
import { mutationRouteErrorResponse } from "@/shared/lib/mutationRouteError";
import { requireMutationSession } from "@/shared/lib/requireMutationSession";
import { createRepaymentSchema } from "@/shared/schemas/repayment";

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

export async function POST(req: Request) {
  const denied = await requireMutationSession();
  if (denied) return denied;
  try {
    const fd = await req.formData();
    const parsed = createRepaymentSchema.parse(formDataToRecord(fd));
    await createRepaymentRecord({
      ...parsed,
      proofUrl: parsed.proofUrl || "",
    });
    return Response.json({ ok: true });
  } catch (e) {
    return mutationRouteErrorResponse(e);
  }
}
