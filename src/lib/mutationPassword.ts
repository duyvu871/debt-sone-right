import "server-only";

import { timingSafeEqual } from "node:crypto";

export function assertValidMutationPassword(provided: string): void {
  const expected = process.env.DEBT_APP_PASSWORD ?? "";
  if (!expected) {
    throw new Error(
      "DEBT_APP_PASSWORD is not set. Add it to your environment.",
    );
  }

  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("incorrect_password");
  }
}
