import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { fetchProject } from '../../api/projects.js'
import BudgetBar from '../../components/BudgetBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { EmptyState, ErrorState } from '../../components/States.jsx'
import { daysBetween, parseLocalDate, today } from '../../lib/dates.js'
import { formatDate, formatNpr } from '../../lib/format.js'
import { SECTOR_LABELS, STATUS_LABELS } from '../../lib/labels.js'
import { SITE_NAME } from '../../lib/site.js'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const { project, error, loading, reload } = useProject(id)
  const backTo = `/${state?.listSearch ?? ''}`

  useEffect(() => {
    if (project) document.title = `${project.title} · ${SITE_NAME}`
    return () => {
      document.title = SITE_NAME
    }
  }, [project])

  return (
    <div>
      <Link to={backTo} className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline">
        ← All projects
      </Link>

      <div className="mt-2">
        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          // 400 covers non-numeric ids like /projects/abc.
          error.status === 404 || error.status === 400 ? (
            <EmptyState title="Project not found">
              <p>This project doesn't exist or may have been removed.</p>
              <Link
                to="/"
                className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
              >
                Browse all projects
              </Link>
            </EmptyState>
          ) : (
            <ErrorState message={error.message} onRetry={reload} />
          )
        ) : (
          <ProjectDetail project={project} />
        )}
      </div>
    </div>
  )
}

function ProjectDetail({ project: p }) {
  return (
    <article className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={p.status} />
          {p.overdue && <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">Overdue</span>}
        </div>
        <h1 className="mt-3 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{p.title}</h1>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-8">
          <Meta label="Sector" value={SECTOR_LABELS[p.sector] ?? p.sector} />
          <Meta label="Ward" value={`Ward ${p.wardNo}`} />
          {p.location && <Meta label="Location" value={p.location} />}
          <Meta label="Fiscal year" value={`FY ${p.fiscalYear}`} />
        </dl>
        {p.description && <p className="mt-4 leading-relaxed text-slate-700">{p.description}</p>}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <BudgetPanel project={p} />
        <SchedulePanel project={p} />
      </div>

      <StatusHistory history={p.statusHistory} />

      <p className="px-1 text-xs text-slate-500">Record last updated {formatDate(p.updatedAt)}.</p>
    </article>
  )
}

function Meta({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="break-words font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function BudgetPanel({ project: p }) {
  const remaining = Number(p.budgetAllocated) - Number(p.budgetSpent)
  return (
    <Panel title="Budget">
      <BudgetBar allocated={p.budgetAllocated} spent={p.budgetSpent} percent={p.utilizationPercent} />
      <dl className="mt-4 divide-y divide-slate-100 text-sm">
        <Row label="Approved budget" value={formatNpr(p.budgetAllocated)} />
        <Row label="Spent so far" value={formatNpr(p.budgetSpent)} />
        {remaining >= 0 ? (
          <Row label="Remaining" value={formatNpr(remaining)} />
        ) : (
          <Row label="Over budget by" value={formatNpr(-remaining)} danger />
        )}
      </dl>
    </Panel>
  )
}

function SchedulePanel({ project: p }) {
  const start = p.startDate && parseLocalDate(p.startDate)
  const target = p.targetEndDate && parseLocalDate(p.targetEndDate)
  const now = today()

  let elapsedPct = null
  if (start && target && target > start) {
    elapsedPct = Math.min(100, Math.max(0, Math.round((daysBetween(start, now) / daysBetween(start, target)) * 100)))
  }

  let summary
  if (p.status === 'COMPLETED') summary = { text: 'Completed', tone: 'text-emerald-700' }
  else if (!target) summary = { text: 'No target date set', tone: 'text-slate-600' }
  else if (p.overdue) summary = { text: `Overdue by ${plural(daysBetween(target, now), 'day')}`, tone: 'text-red-700' }
  else if (start && start > now) summary = { text: `Starts in ${plural(daysBetween(now, start), 'day')}`, tone: 'text-slate-600' }
  else summary = { text: `${plural(daysBetween(now, target), 'day')} remaining`, tone: 'text-slate-700' }

  return (
    <Panel title="Schedule">
      <p className={`text-sm font-semibold ${summary.tone}`}>{summary.text}</p>
      {elapsedPct !== null && p.status !== 'COMPLETED' && (
        <>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={elapsedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Share of scheduled time elapsed"
          >
            <div className={`h-full rounded-full ${p.overdue ? 'bg-red-600' : 'bg-slate-500'}`} style={{ width: `${elapsedPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {elapsedPct}% of scheduled time elapsed · {p.utilizationPercent}% of budget used
          </p>
        </>
      )}
      <dl className="mt-4 divide-y divide-slate-100 text-sm">
        <Row label="Start date" value={formatDate(p.startDate)} />
        <Row label="Target completion" value={formatDate(p.targetEndDate)} danger={p.overdue} />
      </dl>
    </Panel>
  )
}

function Row({ label, value, danger }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-slate-600">{label}</dt>
      <dd className={`text-right font-medium tabular-nums ${danger ? 'text-red-700' : 'text-slate-900'}`}>{value}</dd>
    </div>
  )
}

function StatusHistory({ history }) {
  return (
    <Panel title="Status history">
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No status updates recorded yet.</p>
      ) : (
        // Newest first: citizens mostly care about the latest update.
        <ol className="relative space-y-5 border-l-2 border-slate-200 pl-5">
          {[...history].reverse().map((h, i) => (
            <li key={`${h.changedAt}-${i}`} className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? 'bg-brand-600' : 'bg-slate-300'}`}
              />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusBadge status={h.newStatus} />
                {h.previousStatus && <span className="text-xs text-slate-500">from {STATUS_LABELS[h.previousStatus] ?? h.previousStatus}</span>}
              </div>
              {h.note && <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{h.note}</p>}
              <p className="mt-1 text-xs text-slate-500">
                <time dateTime={h.changedAt}>{formatDate(h.changedAt)}</time> · {h.changedBy}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading project">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="h-5 w-24 rounded-full bg-slate-200" />
        <div className="mt-3 h-6 w-4/5 rounded bg-slate-200" />
        <div className="mt-4 h-3 w-2/3 rounded bg-slate-200" />
        <div className="mt-4 h-16 w-full rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 rounded-xl border border-slate-200 bg-white" />
        <div className="h-48 rounded-xl border border-slate-200 bg-white" />
      </div>
      <div className="h-56 rounded-xl border border-slate-200 bg-white" />
    </div>
  )
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function useProject(id) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${id}#${attempt}`
  const [result, setResult] = useState({ key: null, project: null, error: null })

  useEffect(() => {
    const ctrl = new AbortController()
    fetchProject(requestKey.split('#')[0], ctrl.signal).then(
      (project) => setResult({ key: requestKey, project, error: null }),
      (error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, project: null, error })
      },
    )
    return () => ctrl.abort()
  }, [requestKey])

  const loading = result.key !== requestKey
  return { project: result.project, error: loading ? null : result.error, loading, reload: () => setAttempt((n) => n + 1) }
}
