import { z } from "zod";

export const createDebtSchema = z.object({
  mutationPassword: z.string().min(1),
  creditorId: z.string().min(1),
  totalAmount: z.string().min(1),
  currency: z.enum(["VND", "USD"]).default("VND"),
  occurredAt: z.coerce.date(),
  dueAt: z.coerce.date(),
  status: z.enum(["OPEN", "COMPLETED", "OVERDUE"]).default("OPEN"),
});

export const updateDebtSchema = z.object({
  mutationPassword: z.string().min(1),
  id: z.string().min(1),
  creditorId: z.string().min(1),
  totalAmount: z.string().min(1),
  currency: z.enum(["VND", "USD"]).default("VND"),
  occurredAt: z.coerce.date(),
  dueAt: z.coerce.date(),
  status: z.enum(["OPEN", "COMPLETED", "OVERDUE"]).default("OPEN"),
});

export const deleteDebtSchema = z.object({
  mutationPassword: z.string().min(1),
  id: z.string().min(1),
});

/** Cộng thêm vào totalAmount (không đổi lịch sử trả nợ). */
export const appendDebtPrincipalSchema = z.object({
  mutationPassword: z.string().min(1),
  debtId: z.string().min(1),
  additionalAmount: z.string().min(1),
});
