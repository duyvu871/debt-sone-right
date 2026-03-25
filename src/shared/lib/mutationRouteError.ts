import { ZodError } from "zod";

export function mutationRouteErrorResponse(e: unknown): Response {
  if (e instanceof ZodError) {
    const first = e.issues[0]?.message ?? "validation_error";
    return Response.json({ error: first }, { status: 400 });
  }
  const message = e instanceof Error ? e.message : "Server error";
  return Response.json({ error: message }, { status: 500 });
}
