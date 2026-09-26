/** Shared loading / empty / error states so every page fails loudly and consistently. */

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-accent-100 bg-accent-50 p-6 text-center">
      <p className="font-medium text-accent-700">Something went wrong</p>
      <p className="mt-1 text-sm text-slate-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  )
}

export function CardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading projects">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-5 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="mt-3 h-4 w-5/6 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
          <div className="mt-6 h-2 w-full rounded-full bg-slate-200" />
          <div className="mt-5 h-3 w-1/3 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

/** Placeholder rows for admin tables while the first page loads. */
export function TableSkeleton({ rows = 6, label = 'Loading' }) {
  return (
    <div className="animate-pulse divide-y divide-line" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/5 rounded bg-slate-200" />
            <div className="h-3 w-2/5 rounded bg-slate-100" />
          </div>
          <div className="hidden h-5 w-20 rounded-full bg-slate-200 sm:block" />
          <div className="hidden h-3 w-24 rounded bg-slate-200 md:block" />
        </div>
      ))}
    </div>
  )
}
