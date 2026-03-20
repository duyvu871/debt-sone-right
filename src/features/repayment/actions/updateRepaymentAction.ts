"use server";

import { updateRepaymentRecord } from "@/shared/dal/repaymentDal";
import { updateRepaymentSchema } from "@/shared/schemas/repayment";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const updateRepaymentAction = withMutationPasswordAction(
  updateRepaymentSchema,
  async (input) => {
    await updateRepaymentRecord({
      ...input,
      proofUrl: input.proofUrl || "",
    });
  },
  { revalidatePath: "/" },
);
