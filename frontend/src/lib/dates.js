const DAY_MS = 86_400_000

/** Parses "YYYY-MM-DD" as a local calendar date (no timezone shift). */
export function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Whole calendar days from a to b (negative if b is before a). */
export function daysBetween(a, b) {
  return Math.round((b - a) / DAY_MS)
}
