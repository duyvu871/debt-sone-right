"use server";

import { updateCreditor } from "@/shared/dal/creditorDal";
import { updateCreditorSchema } from "@/shared/schemas/creditor";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const updateCreditorAction = withMutationPasswordAction(
  updateCreditorSchema,
  async (input) => {
    await updateCreditor(input);
  },
  { revalidatePath: "/" },
);
