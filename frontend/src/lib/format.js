// en-IN gives South Asian digit grouping (1,25,00,000), which matches Nepali budget documents.
const nprFull = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export function formatNpr(amount) {
  return `Rs. ${nprFull.format(Number(amount))}`
}

/** Compact form used on cards: Rs. 1.25 crore / Rs. 18.5 lakh. */
export function formatNprShort(amount) {
  const n = Number(amount)
  if (n >= 1e7) return `Rs. ${trim(n / 1e7)} crore`
  if (n >= 1e5) return `Rs. ${trim(n / 1e5)} lakh`
  return formatNpr(n)
}

function trim(x) {
  return x.toFixed(2).replace(/\.?0+$/, '')
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(iso) {
  if (!iso) return '—'
  // Plain "YYYY-MM-DD" dates are parsed as local dates to avoid timezone day shifts.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
  return dateFmt.format(d)
}
