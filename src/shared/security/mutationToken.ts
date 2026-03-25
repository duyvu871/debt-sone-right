import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/** Cookie name for signed mutation session (httpOnly). */
export const MUTATION_TOKEN_COOKIE_NAME = "mutation_token";

/** Session length: 1 hour (matches cookie maxAge). */
export const MUTATION_TOKEN_TTL_MS = 3_600_000;

function getSigningKeyBytes(): Buffer {
  const secret = process.env.DEBT_APP_PASSWORD ?? "";
  if (!secret) {
    throw new Error(
      "DEBT_APP_PASSWORD is not set. Add it to your environment.",
    );
  }
  return createHmac("sha256", "debt-app-mutation-token-v1")
    .update(secret, "utf8")
    .digest();
}

/**
 * Signed token: base64url(JSON({ exp })).hex_hmac_sha256(payloadB64)
 * Key derived from DEBT_APP_PASSWORD (not stored in token).
 */
export function createMutationToken(): string {
  const exp = Date.now() + MUTATION_TOKEN_TTL_MS;
  const payload = JSON.stringify({ exp });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const key = getSigningKeyBytes();
  const sig = createHmac("sha256", key)
    .update(payloadB64, "utf8")
    .digest("hex");
  return `${payloadB64}.${sig}`;
}

export function verifyMutationToken(token: string): {
  valid: boolean;
  expired: boolean;
  expiresAt?: number;
} {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, expired: false };
  }
  const [payloadB64, sigHex] = parts;
  if (!payloadB64 || !sigHex) {
    return { valid: false, expired: false };
  }

  let key: Buffer;
  try {
    key = getSigningKeyBytes();
  } catch {
    return { valid: false, expired: false };
  }

  const expectedSig = createHmac("sha256", key)
    .update(payloadB64, "utf8")
    .digest("hex");

  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sigHex, "hex");
  } catch {
    return { valid: false, expired: false };
  }
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, expired: false };
  }

  try {
    const json = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    if (typeof json.exp !== "number" || !Number.isFinite(json.exp)) {
      return { valid: false, expired: false };
    }
    const expiresAt = json.exp;
    if (Date.now() > expiresAt) {
      return { valid: false, expired: true, expiresAt };
    }
    return { valid: true, expired: false, expiresAt };
  } catch {
    return { valid: false, expired: false };
  }
}
