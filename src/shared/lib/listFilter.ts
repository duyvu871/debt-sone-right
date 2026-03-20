/** Case-insensitive substring match; empty query matches all. */
export function matchesSearch(haystack: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}
