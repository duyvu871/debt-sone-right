import { z } from "zod";

export const createRepaymentSchema = z.object({
  debtId: z.string().min(1),
  happenedAt: z.coerce.date(),
  deltaAmount: z.string().min(1),
  note: z.string().min(1),
  proofUrl: z.string().optional().default(""),
});

export const updateRepaymentSchema = z.object({
  id: z.string().min(1),
  happenedAt: z.coerce.date(),
  deltaAmount: z.string().min(1),
  note: z.string().min(1),
  proofUrl: z.string().optional().default(""),
});

export const deleteRepaymentSchema = z.object({
  id: z.string().min(1),
});
