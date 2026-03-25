import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { assertValidMutationPassword } from "@/lib/mutationPassword";
import {
  createMutationToken,
  MUTATION_TOKEN_COOKIE_NAME,
  MUTATION_TOKEN_TTL_MS,
  verifyMutationToken,
} from "@/shared/security/mutationToken";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(MUTATION_TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      return Response.json({ authenticated: false as const });
    }
    const v = verifyMutationToken(token);
    if (!v.valid || v.expired) {
      return Response.json({ authenticated: false as const });
    }
    return Response.json({
      authenticated: true as const,
      expiresAt: v.expiresAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }
    const password =
      typeof body === "object" &&
      body !== null &&
      "password" in body &&
      typeof (body as { password: unknown }).password === "string"
        ? (body as { password: string }).password
        : "";

    assertValidMutationPassword(password);

    const token = createMutationToken();
    const expiresAt = Date.now() + MUTATION_TOKEN_TTL_MS;

    const res = NextResponse.json({
      ok: true as const,
      expiresAt,
    });
    res.cookies.set(MUTATION_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: Math.floor(MUTATION_TOKEN_TTL_MS / 1000),
      path: "/",
    });
    return res;
  } catch (e) {
    if (e instanceof Error && e.message === "incorrect_password") {
      return Response.json({ error: "incorrect_password" }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
