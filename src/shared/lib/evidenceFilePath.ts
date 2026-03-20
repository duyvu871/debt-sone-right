import { randomUUID } from "node:crypto";

export function buildEvidenceFilePath(params: {
  tenantId: string;
  debtId: string;
  originalFileName: string;
}) {
  const { tenantId, debtId, originalFileName } = params;

  const ext = (() => {
    const parts = originalFileName.split(".");
    const last = parts.at(-1);
    if (!last) return null;
    // Basic hardening: avoid weird extensions.
    return /^[a-z0-9]+$/i.test(last) ? last.toLowerCase() : null;
  })();

  const random = randomUUID().slice(0, 8);
  const timestampIso = new Date().toISOString();

  const safeExt = ext ? `.${ext}` : "";

  return `${tenantId}/${debtId}/${timestampIso}-${random}${safeExt}`;
}
