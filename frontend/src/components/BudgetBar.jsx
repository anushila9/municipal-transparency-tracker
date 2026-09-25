import { formatNprShort } from '../lib/format.js'

/** Spent vs. allocated. Overspend is shown in red rather than capped silently. */
export default function BudgetBar({ allocated, spent, percent }) {
  const pct = Number(percent)
  const over = pct > 100
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-slate-600">
          <span className="font-semibold text-slate-900">{formatNprShort(spent)}</span> spent
        </span>
        <span className="text-slate-500">of {formatNprShort(allocated)}</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget utilisation"
      >
        <div className={`h-full rounded-full ${over ? 'bg-red-600' : 'bg-brand-600'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className={`mt-1 text-xs ${over ? 'font-medium text-red-700' : 'text-slate-500'}`}>{pct}% of budget used</p>
    </div>
  )
}
