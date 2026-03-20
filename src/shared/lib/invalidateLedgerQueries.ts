import type { QueryClient } from "@tanstack/react-query";

/** After mutations, refresh dashboard + all entity lists/details. */
export async function invalidateLedgerQueries(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["ledger"] }),
    qc.invalidateQueries({ queryKey: ["creditors"] }),
    qc.invalidateQueries({ queryKey: ["creditor"] }),
    qc.invalidateQueries({ queryKey: ["debts"] }),
    qc.invalidateQueries({ queryKey: ["debt"] }),
    qc.invalidateQueries({ queryKey: ["repayments"] }),
    qc.invalidateQueries({ queryKey: ["repayment"] }),
  ]);
}
