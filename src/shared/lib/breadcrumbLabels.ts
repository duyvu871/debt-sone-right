/** Rút gọn nhãn breadcrumb khi chuỗi quá dài. */
export function crumbLabel(text: string, maxLen = 40): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}
