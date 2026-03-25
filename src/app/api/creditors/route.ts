import { createCreditor } from "@/shared/dal/creditorDal";
import type { CreditorWithDebtCount } from "@/shared/dal/creditorDal";
import { listCreditors } from "@/shared/dal/creditorDal";
import { listDebts } from "@/shared/dal/debtDal";
import { formDataToRecord } from "@/shared/lib/formDataToRecord";
import { mutationRouteErrorResponse } from "@/shared/lib/mutationRouteError";
import { requireMutationSession } from "@/shared/lib/requireMutationSession";
import { createCreditorSchema } from "@/shared/schemas/creditor";

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

export async function POST(req: Request) {
  const denied = await requireMutationSession();
  if (denied) return denied;
  try {
    const fd = await req.formData();
    const parsed = createCreditorSchema.parse(formDataToRecord(fd));
    await createCreditor(parsed);
    return Response.json({ ok: true });
  } catch (e) {
    return mutationRouteErrorResponse(e);
  }
}
