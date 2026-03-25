"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useMutationAuth } from "@/shared/MutationAuthProvider";
import { fetchMutation } from "@/shared/lib/fetchMutation";
import { invalidateLedgerQueries } from "@/shared/lib/invalidateLedgerQueries";
import { runMutationWithAuth } from "@/shared/lib/runMutationWithAuth";

export function useUpdateDebt() {
  const qc = useQueryClient();
  const { requireAuth, clearAuth } = useMutationAuth();
  return useMutation({
    mutationFn: (fd: FormData) =>
      runMutationWithAuth(requireAuth, clearAuth, () => {
        const id = fd.get("id");
        if (typeof id !== "string" || !id) throw new Error("missing_id");
        return fetchMutation(`/api/debts/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: fd,
        });
      }),
    onSuccess: () => invalidateLedgerQueries(qc),
  });
}
