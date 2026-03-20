"use server";

import { createRepaymentRecord } from "@/shared/dal/repaymentDal";
import { createRepaymentSchema } from "@/shared/schemas/repayment";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const createRepaymentAction = withMutationPasswordAction(
  createRepaymentSchema,
  async (input) => {
    await createRepaymentRecord({
      ...input,
      proofUrl: input.proofUrl || "",
    });
  },
  { revalidatePath: "/" },
);
