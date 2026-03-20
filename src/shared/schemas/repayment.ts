import { z } from "zod";

export const createRepaymentSchema = z.object({
  mutationPassword: z.string().min(1),
  debtId: z.string().min(1),
  happenedAt: z.coerce.date(),
  deltaAmount: z.string().min(1),
  note: z.string().min(1),
  proofUrl: z.string().optional().default(""),
});

export const updateRepaymentSchema = z.object({
  mutationPassword: z.string().min(1),
  id: z.string().min(1),
  happenedAt: z.coerce.date(),
  deltaAmount: z.string().min(1),
  note: z.string().min(1),
  proofUrl: z.string().optional().default(""),
});

export const deleteRepaymentSchema = z.object({
  mutationPassword: z.string().min(1),
  id: z.string().min(1),
});
