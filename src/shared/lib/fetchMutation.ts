/**
 * Call a mutation API route with FormData and session cookie.
 * Throws `Error("session_expired")` on 401 with that code.
 */
export async function fetchMutation(
  url: string,
  init: { method?: string; body?: FormData },
): Promise<void> {
  const res = await fetch(url, {
    method: init.method ?? "POST",
    ...(init.body !== undefined ? { body: init.body } : {}),
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    throw new Error(
      data.error === "session_expired" ? "session_expired" : "unauthorized",
    );
  }
  if (!res.ok) {
    throw new Error(data.error ?? "request_failed");
  }
}
