export type LedgerStats = {
  byCurrency: Record<
    string,
    { principal: number; repaid: number; outstanding: number }
  >;
  openCount: number;
  overdueCount: number;
  completedCount: number;
  debtCount: number;
  repaymentCount: number;
};
