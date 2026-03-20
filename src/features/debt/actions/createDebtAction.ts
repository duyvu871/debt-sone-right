"use server";

import { createDebt } from "@/shared/dal/debtDal";
import { createDebtSchema } from "@/shared/schemas/debt";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const createDebtAction = withMutationPasswordAction(
  createDebtSchema,
  async (input) => {
    await createDebt(input);
  },
  { revalidatePath: "/" },
);
