"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useMutationAuth } from "@/shared/MutationAuthProvider";
import { fetchMutation } from "@/shared/lib/fetchMutation";
import { invalidateLedgerQueries } from "@/shared/lib/invalidateLedgerQueries";
import { runMutationWithAuth } from "@/shared/lib/runMutationWithAuth";

export function useCreateDebt() {
  const qc = useQueryClient();
  const { requireAuth, clearAuth } = useMutationAuth();
  return useMutation({
    mutationFn: (fd: FormData) =>
      runMutationWithAuth(requireAuth, clearAuth, () =>
        fetchMutation("/api/debts", { body: fd }),
      ),
    onSuccess: () => invalidateLedgerQueries(qc),
  });
}
