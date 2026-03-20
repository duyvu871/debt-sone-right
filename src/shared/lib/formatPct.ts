/** Hiển thị thay đổi % (vd: so với kỳ trước). */
export function formatPercentChange(prev: number, cur: number): string {
  if (prev === 0 && cur === 0) return "—";
  if (prev === 0) return "Có dữ liệu mới";
  const pct = ((cur - prev) / prev) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
