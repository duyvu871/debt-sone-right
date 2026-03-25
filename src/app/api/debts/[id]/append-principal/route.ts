import { appendDebtPrincipal } from "@/shared/dal/debtDal";
import { formDataToRecord } from "@/shared/lib/formDataToRecord";
import { mutationRouteErrorResponse } from "@/shared/lib/mutationRouteError";
import { requireMutationSession } from "@/shared/lib/requireMutationSession";
import { appendDebtPrincipalSchema } from "@/shared/schemas/debt";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  const denied = await requireMutationSession();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const fd = await req.formData();
    const raw = formDataToRecord(fd);
    if (raw.debtId !== id) {
      return Response.json({ error: "id_mismatch" }, { status: 400 });
    }
    const parsed = appendDebtPrincipalSchema.parse(raw);
    await appendDebtPrincipal({
      debtId: parsed.debtId,
      additionalAmount: parsed.additionalAmount,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return mutationRouteErrorResponse(e);
  }
}
