"use server";

import { deleteCreditorById } from "@/shared/dal/creditorDal";
import { deleteCreditorSchema } from "@/shared/schemas/creditor";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const deleteCreditorAction = withMutationPasswordAction(
  deleteCreditorSchema,
  async (input) => {
    await deleteCreditorById(input.id);
  },
  { revalidatePath: "/" },
);
