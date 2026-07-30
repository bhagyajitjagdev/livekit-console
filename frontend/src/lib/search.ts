/** Case-insensitive match across the fields a row is searchable by. */
export function matches(query: string, ...fields: Array<unknown>): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields
    .flat()
    .filter((f): f is string | number => f !== null && f !== undefined)
    .some((f) => String(f).toLowerCase().includes(q))
}
