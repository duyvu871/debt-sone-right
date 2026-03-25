import { cookies } from "next/headers";

import {
  MUTATION_TOKEN_COOKIE_NAME,
  verifyMutationToken,
} from "@/shared/security/mutationToken";

/** Returns a 401 JSON response if mutation cookie is missing or invalid; otherwise `null`. */
export async function requireMutationSession(): Promise<Response | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MUTATION_TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    return Response.json({ error: "session_expired" }, { status: 401 });
  }
  const v = verifyMutationToken(token);
  if (!v.valid || v.expired) {
    return Response.json({ error: "session_expired" }, { status: 401 });
  }
  return null;
}
