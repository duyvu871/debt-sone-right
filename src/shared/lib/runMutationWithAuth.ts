/**
 * Run a mutation API call after auth; if the server returns `session_expired`,
 * clear client auth state, prompt again once, then retry.
 */
export async function runMutationWithAuth<T>(
  requireAuth: () => Promise<void>,
  clearAuth: () => void,
  run: () => Promise<T>,
): Promise<T> {
  await requireAuth();
  try {
    return await run();
  } catch (e) {
    if (e instanceof Error && e.message === "session_expired") {
      clearAuth();
      await requireAuth();
      return await run();
    }
    throw e;
  }
}
