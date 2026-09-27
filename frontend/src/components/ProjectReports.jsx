import { useEffect, useState } from 'react'
import { Clock, Landmark, MessageSquare } from 'lucide-react'
import { fetchProjectReports } from '../api/projects.js'
import Button from './ui/Button.jsx'
import { ErrorState } from './States.jsx'
import { formatDate } from '../lib/format.js'

/**
 * Public list of citizen reports on a project, each with the municipality's reply once there is one.
 * Reports are shown without names: people find their own by what they wrote.
 * Bump `refreshKey` to reload from the first page (e.g. after a new report is sent).
 */
export default function ProjectReports({ projectId, refreshKey }) {
  const [state, setState] = useState({ key: null, items: [], page: 0, totalPages: 0, totalElements: 0, error: null })
  const [attempt, setAttempt] = useState(0)
  const [more, setMore] = useState({ loading: false, error: null })
  const requestKey = `${projectId}#${refreshKey}#${attempt}`

  useEffect(() => {
    const ctrl = new AbortController()
    fetchProjectReports(projectId, 0, ctrl.signal).then(
      (data) => setState({ key: requestKey, items: data.content, page: 0, totalPages: data.totalPages, totalElements: data.totalElements, error: null }),
      (error) => {
        if (error.name !== 'AbortError') setState({ key: requestKey, items: [], page: 0, totalPages: 0, totalElements: 0, error })
      },
    )
    setMore({ loading: false, error: null })
    return () => ctrl.abort()
  }, [projectId, requestKey])

  async function loadMore() {
    setMore({ loading: true, error: null })
    try {
      const data = await fetchProjectReports(projectId, state.page + 1)
      setState((s) => {
        // New reports may have shifted pages since the first load; skip any already shown.
        const seen = new Set(s.items.map((r) => r.id))
        return { ...s, items: [...s.items, ...data.content.filter((r) => !seen.has(r.id))], page: data.page, totalPages: data.totalPages, totalElements: data.totalElements }
      })
      setMore({ loading: false, error: null })
    } catch (error) {
      setMore({ loading: false, error: error.message })
    }
  }

  const loading = state.key !== requestKey
  const answered = state.items.filter((r) => r.response).length

  return (
    <section aria-labelledby="reports-heading" className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6">
      <h2 id="reports-heading" className="text-base font-semibold text-slate-900">
        Citizen reports and replies
        {!loading && !state.error && state.totalElements > 0 && <span className="ml-1.5 font-normal text-slate-500">({state.totalElements})</span>}
      </h2>
      <p className="mt-1 text-sm text-slate-600">What citizens reported about this project and how the municipality replied. Names are not shown.</p>

      <div className="mt-4">
        {loading ? (
          <ReportsSkeleton />
        ) : state.error ? (
          <ErrorState message={state.error.message} onRetry={() => setAttempt((n) => n + 1)} />
        ) : state.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-slate-500">
            No reports yet. If something here doesn't match what you see on the ground, be the first to report it below.
          </p>
        ) : (
          <>
            <ol className="space-y-3">
              {state.items.map((r) => (
                <li key={r.id}>
                  <ReportItem report={r} />
                </li>
              ))}
            </ol>
            {state.page + 1 < state.totalPages ? (
              <div className="mt-4 text-center">
                {more.error && (
                  <p role="alert" className="mb-2 text-sm text-accent-700">
                    {more.error}
                  </p>
                )}
                <Button variant="secondary" loading={more.loading} onClick={loadMore} className="w-full sm:w-auto">
                  {more.error ? 'Try again' : 'Show older reports'}
                </Button>
              </div>
            ) : (
              state.items.length > 1 && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  {answered} of {state.items.length} reports answered
                </p>
              )
            )}
          </>
        )}
      </div>
    </section>
  )
}

function ReportItem({ report: r }) {
  return (
    <article className="overflow-hidden rounded-lg border border-line">
      <div className="px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
          Citizen report · <time dateTime={r.submittedAt}>{formatDate(r.submittedAt)}</time>
        </p>
        <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-800">{r.comment}</p>
      </div>
      {r.response ? (
        <div className="border-t border-brand-100 bg-brand-50/60 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-800">
            <Landmark aria-hidden="true" className="h-3.5 w-3.5" />
            Municipal reply · <time dateTime={r.respondedAt} className="font-normal text-slate-600">{formatDate(r.respondedAt)}</time>
          </p>
          <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-800">{r.response}</p>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 border-t border-line bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
          <Clock aria-hidden="true" className="h-3.5 w-3.5" /> Awaiting municipal reply
        </p>
      )}
    </article>
  )
}

function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading reports">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border border-line p-4">
          <div className="h-3 w-40 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
