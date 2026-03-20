"use server";

import { updateDebt } from "@/shared/dal/debtDal";
import { updateDebtSchema } from "@/shared/schemas/debt";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const updateDebtAction = withMutationPasswordAction(
  updateDebtSchema,
  async (input) => {
    await updateDebt(input);
  },
  { revalidatePath: "/" },
);
