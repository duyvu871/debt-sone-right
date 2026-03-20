import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { assertValidMutationPassword } from "@/lib/mutationPassword";

type AnyZodSchema = z.ZodTypeAny;

function formDataToRecord(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    raw[key] = value;
  }
  return raw;
}

export function withMutationPasswordAction<
  TSchema extends AnyZodSchema,
  TResult,
>(
  schema: TSchema,
  action: (
    input: Omit<z.infer<TSchema>, "mutationPassword">,
  ) => Promise<TResult>,
  options?: { revalidatePath?: string },
) {
  return async (formData: FormData) => {
    const raw = formDataToRecord(formData);
    const parsed = schema.parse(raw) as z.infer<TSchema> & {
      mutationPassword: string;
    };

    const { mutationPassword, ...business } = parsed;
    assertValidMutationPassword(mutationPassword);

    const result = await action(
      business as Omit<z.infer<TSchema>, "mutationPassword">,
    );

    if (options?.revalidatePath) revalidatePath(options.revalidatePath);

    return result;
  };
}
