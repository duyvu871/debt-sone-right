"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useMutationAuth } from "@/shared/MutationAuthProvider";
import { fetchMutation } from "@/shared/lib/fetchMutation";
import { invalidateLedgerQueries } from "@/shared/lib/invalidateLedgerQueries";
import { runMutationWithAuth } from "@/shared/lib/runMutationWithAuth";

export function useAppendDebtPrincipal() {
  const qc = useQueryClient();
  const { requireAuth, clearAuth } = useMutationAuth();
  return useMutation({
    mutationFn: (fd: FormData) =>
      runMutationWithAuth(requireAuth, clearAuth, () => {
        const debtId = fd.get("debtId");
        if (typeof debtId !== "string" || !debtId) {
          throw new Error("missing_id");
        }
        return fetchMutation(
          `/api/debts/${encodeURIComponent(debtId)}/append-principal`,
          { body: fd },
        );
      }),
    onSuccess: () => invalidateLedgerQueries(qc),
  });
}
