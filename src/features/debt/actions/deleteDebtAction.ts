"use server";

import { deleteDebtById } from "@/shared/dal/debtDal";
import { deleteDebtSchema } from "@/shared/schemas/debt";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const deleteDebtAction = withMutationPasswordAction(
  deleteDebtSchema,
  async (input) => {
    await deleteDebtById(input.id);
  },
  { revalidatePath: "/" },
);
