"use server";

import { appendDebtPrincipal } from "@/shared/dal/debtDal";
import { appendDebtPrincipalSchema } from "@/shared/schemas/debt";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const appendDebtPrincipalAction = withMutationPasswordAction(
  appendDebtPrincipalSchema,
  async (input) => {
    await appendDebtPrincipal({
      debtId: input.debtId,
      additionalAmount: input.additionalAmount,
    });
  },
  { revalidatePath: "/" },
);
