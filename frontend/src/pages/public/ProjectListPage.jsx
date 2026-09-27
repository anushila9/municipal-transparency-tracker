import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { fetchProjects } from '../../api/projects.js'
import { useMeta } from '../../api/useMeta.js'
import ProjectCard from '../../components/ProjectCard.jsx'
import { CardSkeletonGrid, EmptyState, ErrorState } from '../../components/States.jsx'
import { SECTOR_LABELS, STATUS_LABELS } from '../../lib/labels.js'

const PAGE_SIZE = 12
const FILTER_KEYS = ['q', 'sector', 'status', 'fiscalYear', 'ward']
const SORT_OPTIONS = [
  { value: 'RECENT', label: 'Recently updated' },
  { value: 'BUDGET_DESC', label: 'Budget: high to low' },
  { value: 'BUDGET_ASC', label: 'Budget: low to high' },
  { value: 'TITLE', label: 'Title (A–Z)' },
]

const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }))

export default function ProjectListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const meta = useMeta()
  const { data, error, loading, reload } = useProjectSearch(searchParams)

  const page = Number(searchParams.get('page') ?? 0)
  const hasFilters = FILTER_KEYS.some((k) => searchParams.get(k))

  // Any filter change resets to the first page.
  const updateParam = useCallback(
    (key, value) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          if (key !== 'page') next.delete('page')
          return next
        },
        { replace: key === 'q' },
      ),
    [setSearchParams],
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Development Projects</h1>
        <p className="mt-1 text-slate-600">
          See what was approved, what has been spent, and where each project stands.
        </p>
      </div>

      <Filters meta={meta} searchParams={searchParams} onChange={updateParam} onClear={() => setSearchParams({})} hasFilters={hasFilters} />

      <div className="mt-6">
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : loading && !data ? (
          <CardSkeletonGrid />
        ) : data.totalElements === 0 ? (
          <EmptyState title="No projects match your filters">
            {hasFilters && (
              <button onClick={() => setSearchParams({})} className="inline-flex min-h-11 items-center font-medium text-brand-700 underline">
                Clear all filters
              </button>
            )}
          </EmptyState>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : undefined} aria-busy={loading}>
            <p className="mb-3 text-sm text-slate-600" aria-live="polite">
              Showing {data.content.length} of {data.totalElements} project{data.totalElements === 1 ? '' : 's'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.content.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
            <Pagination page={page} totalPages={data.totalPages} onPage={(p) => updateParam('page', p > 0 ? String(p) : '')} />
          </div>
        )}
      </div>
    </div>
  )
}

function Filters({ meta, searchParams, onChange, onClear, hasFilters }) {
  const urlQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlQuery)

  // Keep the input in sync when the URL changes externally (back button, "clear filters").
  // Compared against the trimmed input so a trailing space being typed isn't wiped out.
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    if (urlQuery !== query.trim()) setQuery(urlQuery)
  }

  // Debounce typing before it hits the URL (and therefore the API).
  useEffect(() => {
    if (query === urlQuery) return
    const t = setTimeout(() => onChange('q', query.trim()), 300)
    return () => clearTimeout(t)
  }, [query, urlQuery, onChange])

  // If /api/meta fails, fall back to built-in labels so filtering still works.
  const sectors = meta?.sectors ?? toOptions(SECTOR_LABELS)
  const statuses = meta?.statuses ?? toOptions(STATUS_LABELS)
  const fiscalYears = meta?.fiscalYears ?? []
  const wards = meta?.wards ?? []

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="block">
        <span className="sr-only">Search projects</span>
        <input
          type="search"
          value={query}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or location…"
          className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Select label="Sector" value={searchParams.get('sector')} onChange={(v) => onChange('sector', v)} options={sectors} allLabel="All sectors" />
        <Select label="Status" value={searchParams.get('status')} onChange={(v) => onChange('status', v)} options={statuses} allLabel="All status" />
        <Select
          label="Fiscal year"
          value={searchParams.get('fiscalYear')}
          onChange={(v) => onChange('fiscalYear', v)}
          options={fiscalYears.map((fy) => ({ value: fy, label: `FY ${fy}` }))}
          allLabel="All years"
        />
        {wards.length > 1 ? (
          <Select
            label="Ward"
            value={searchParams.get('ward')}
            onChange={(v) => onChange('ward', v)}
            options={wards.map((w) => ({ value: String(w), label: `Ward ${w}` }))}
            allLabel="All wards"
          />
        ) : null}
        <Select
          label="Sort by"
          value={searchParams.get('sort') ?? 'RECENT'}
          onChange={(v) => onChange('sort', v === 'RECENT' ? '' : v)}
          options={SORT_OPTIONS}
        />
      </div>

      {hasFilters && (
        <button onClick={onClear} className="mt-1 -ml-1 inline-flex min-h-11 items-center px-1 text-sm font-medium text-brand-700 hover:underline">
          Clear filters
        </button>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options, allLabel }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-base sm:text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  const btn = 'min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-slate-50'
  return (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
      <button className={btn} disabled={page <= 0} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-sm text-slate-600">
        Page {page + 1} of {totalPages}
      </span>
      <button className={btn} disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  )
}

function useProjectSearch(searchParams) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${searchParams.toString()}#${attempt}`
  // Each result remembers which request produced it, so "loading" is derived rather than stored.
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const ctrl = new AbortController()
    const params = Object.fromEntries(new URLSearchParams(requestKey.split('#')[0]))
    fetchProjects({ ...params, size: PAGE_SIZE }, ctrl.signal).then(
      (data) => setResult({ key: requestKey, data, error: null }),
      (error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, data: null, error })
      },
    )
    return () => ctrl.abort()
  }, [requestKey])

  const loading = result.key !== requestKey
  return {
    data: result.data,
    // Hide a stale error while a retry is in flight.
    error: loading ? null : result.error,
    loading,
    reload: () => setAttempt((n) => n + 1),
  }
}
