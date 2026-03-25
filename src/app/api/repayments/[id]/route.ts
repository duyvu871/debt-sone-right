import { listDebts } from "@/shared/dal/debtDal";
import {
  deleteRepaymentRecordById,
  getRepaymentById,
  updateRepaymentRecord,
} from "@/shared/dal/repaymentDal";
import { formDataToRecord } from "@/shared/lib/formDataToRecord";
import { mutationRouteErrorResponse } from "@/shared/lib/mutationRouteError";
import { requireMutationSession } from "@/shared/lib/requireMutationSession";
import { updateRepaymentSchema } from "@/shared/schemas/repayment";

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
    const parsed = updateRepaymentSchema.parse(raw);
    await updateRepaymentRecord({
      ...parsed,
      proofUrl: parsed.proofUrl || "",
    });
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
    await deleteRepaymentRecordById(id);
    return Response.json({ ok: true });
  } catch (e) {
    return mutationRouteErrorResponse(e);
  }
}
