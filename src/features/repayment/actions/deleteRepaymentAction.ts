"use server";

import { deleteRepaymentRecordById } from "@/shared/dal/repaymentDal";
import { deleteRepaymentSchema } from "@/shared/schemas/repayment";
import { withMutationPasswordAction } from "@/shared/security/withMutationPasswordAction";

export const deleteRepaymentAction = withMutationPasswordAction(
  deleteRepaymentSchema,
  async (input) => {
    await deleteRepaymentRecordById(input.id);
  },
  { revalidatePath: "/" },
);
