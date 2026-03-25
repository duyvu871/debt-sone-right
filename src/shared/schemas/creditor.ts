import { z } from "zod";

export const createCreditorSchema = z.object({
  name: z.string().min(1),
  phone: z
    .string()
    .optional()
    .transform((v) => (v == null || v.trim() === "" ? null : v)),
  note: z
    .string()
    .optional()
    .transform((v) => (v == null || v.trim() === "" ? null : v)),
});

export const updateCreditorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z
    .string()
    .optional()
    .transform((v) => (v == null || v.trim() === "" ? null : v)),
  note: z
    .string()
    .optional()
    .transform((v) => (v == null || v.trim() === "" ? null : v)),
});

export const deleteCreditorSchema = z.object({
  id: z.string().min(1),
});
