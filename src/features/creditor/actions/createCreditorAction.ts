"use server";

import { createCreditor } from "@/shared/dal/creditorDal";
import { createCreditorSchema } from "@/shared/schemas/creditor";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const createCreditorAction = withMutationPasswordAction(
  createCreditorSchema,
  async (input) => {
    await createCreditor(input);
  },
  { revalidatePath: "/" },
);
