import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { CheckCircle2, Clock, ImageIcon, MessageSquareReply, Pencil, User, X } from 'lucide-react'
import { fetchReportPhoto, fetchReports, respondToReport } from '../../api/admin.js'
import { useRequest } from '../../api/useRequest.js'
import { useUrlParams } from '../../components/admin/useUrlParams.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { ErrorState, TableSkeleton } from '../../components/States.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Field, { Textarea } from '../../components/ui/Field.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { formatDate } from '../../lib/format.js'

const PAGE_SIZE = 10
const TABS = [
  { value: 'OPEN', label: 'Awaiting response', count: 'open' },
  { value: 'RESPONDED', label: 'Responded', count: 'responded' },
  { value: 'ALL', label: 'All' },
]

export default function AdminReportsPage() {
  const { reportCounts, refreshCounts } = useOutletContext()
  const { params, set, page } = useUrlParams()
  const state = TABS.some((t) => t.value === params.get('state')) ? params.get('state') : 'OPEN'
  const projectId = params.get('projectId')
  const key = `${state}|${projectId}|${page}`
  const { data, error, loading, reload, setData } = useRequest(key, (signal) =>
    fetchReports({ state, projectId, page, size: PAGE_SIZE }, signal),
  )

  const counts = { ...reportCounts, ALL: reportCounts && reportCounts.open + reportCounts.responded }

  function onResponded(updated) {
    refreshCounts()
    setData((d) => d && { ...d, content: d.content.map((r) => (r.id === updated.id ? updated : r)) })
  }

  return (
    <div>
      <PageHeader title="Citizen reports" description="Reports submitted by citizens about project progress. Responses are attributed to your account." />

      {projectId && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-600">Showing reports for</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50 py-1 pr-1 pl-3 font-medium text-brand-800">
            {data?.content[0]?.projectTitle ?? `project #${projectId}`}
            <button onClick={() => set('projectId', '')} className="grid h-7 w-7 place-items-center rounded-full hover:bg-brand-100" aria-label="Show reports for all projects">
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      )}

      <div role="tablist" aria-label="Filter reports" className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const active = t.value === state
          const n = t.count ? reportCounts?.[t.count] : counts.ALL
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => set('state', t.value === 'OPEN' ? '' : t.value)}
              className={`-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium ${
                active ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
              {n != null && !projectId && (
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-700'}`}>{n}</span>
              )}
            </button>
          )
        })}
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data ? (
        <Card>
          <TableSkeleton rows={4} label="Loading reports" />
        </Card>
      ) : data.totalElements === 0 ? (
        <Card className="px-4 py-14 text-center">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-3 font-medium text-slate-800">
            {state === 'OPEN' ? 'No reports awaiting a response' : state === 'RESPONDED' ? 'No responded reports yet' : 'No reports yet'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {state === 'OPEN' ? 'Every citizen report has been answered.' : 'Reports appear here when citizens submit them from a project page.'}
          </p>
        </Card>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined} aria-busy={loading}>
          <ul className="space-y-4">
            {data.content.map((r) => (
              <li key={r.id}>
                <ReportCard report={r} onResponded={onResponded} />
              </li>
            ))}
          </ul>
          <Card className="mt-4">
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} pageSize={PAGE_SIZE} noun="report" onPage={(p) => set('page', p > 0 ? String(p) : '')} />
          </Card>
        </div>
      )}
    </div>
  )
}

function ReportCard({ report: r, onResponded }) {
  const [editing, setEditing] = useState(false)
  const responded = Boolean(r.adminResponse)

  return (
    <Card as="article" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <Link to={`/admin/projects/${r.projectId}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
            {r.projectTitle}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>Ward {r.projectWardNo}</span>
            <StatusBadge status={r.projectStatus} />
          </p>
        </div>
        {responded ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Responded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-300 ring-inset">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" /> Awaiting response
          </span>
        )}
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <User aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-700">{r.reporterName ?? 'Anonymous citizen'}</span>
          <span>· {formatDate(r.submittedAt)}</span>
        </p>
        <blockquote className="mt-2 border-l-4 border-slate-200 pl-3 whitespace-pre-line text-slate-800">{r.comment}</blockquote>
        {r.hasPhoto && <ReportPhoto reportId={r.id} />}
      </div>

      <div className="border-t border-line bg-slate-50/60 px-4 py-4 sm:px-5">
        {responded && !editing ? (
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                <MessageSquareReply aria-hidden="true" className="h-3.5 w-3.5" /> Official response
              </p>
              <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
                Edit
              </Button>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{r.adminResponse}</p>
            <p className="mt-2 text-xs text-slate-500">
              {r.respondedBy} · {formatDate(r.respondedAt)}
            </p>
          </div>
        ) : (
          <ResponseForm
            report={r}
            onCancel={responded ? () => setEditing(false) : null}
            onSaved={(updated) => {
              setEditing(false)
              onResponded(updated)
            }}
          />
        )}
      </div>
    </Card>
  )
}

function ResponseForm({ report, onCancel, onSaved }) {
  const toast = useToast()
  const [text, setText] = useState(report.adminResponse ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) {
      setError('Write a response before sending.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await respondToReport(report.id, text.trim())
      toast.success(report.adminResponse ? 'Response updated.' : 'Response sent.')
      onSaved(updated)
    } catch (err) {
      setError(err.fieldErrors?.response ? `Response ${err.fieldErrors.response}.` : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Field label={report.adminResponse ? 'Edit response' : 'Your response'} error={error} hint={`${text.length}/2000 · Be specific: what was found, what happens next, and when.`}>
        {(p) => <Textarea {...p} rows={3} maxLength={2000} value={text} onChange={(e) => { setText(e.target.value); if (error) setError(null) }} invalid={Boolean(error)} />}
      </Field>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" icon={MessageSquareReply} loading={busy}>
          {report.adminResponse ? 'Update response' : 'Send response'}
        </Button>
      </div>
    </form>
  )
}

/** Photos are admin-only, so they're fetched with the session token and shown from a local object URL. */
function ReportPhoto({ reportId }) {
  const [state, setState] = useState({ id: null, url: null, failed: false })

  useEffect(() => {
    const ctrl = new AbortController()
    let url = null
    fetchReportPhoto(reportId, ctrl.signal).then(
      (blob) => {
        url = URL.createObjectURL(blob)
        setState({ id: reportId, url, failed: false })
      },
      (err) => err.name !== 'AbortError' && setState({ id: reportId, url: null, failed: true }),
    )
    return () => {
      ctrl.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [reportId])

  if (state.id !== reportId) {
    return <div className="mt-3 h-24 w-32 animate-pulse rounded-lg bg-slate-100" aria-label="Loading photo" />
  }
  if (state.failed) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
        <ImageIcon aria-hidden="true" className="h-4 w-4" /> Photo could not be loaded.
      </p>
    )
  }
  return (
    <a href={state.url} target="_blank" rel="noreferrer" className="mt-3 inline-block" title="Open full size">
      <img src={state.url} alt="Photo attached by the citizen" className="h-24 max-w-48 rounded-lg border border-line object-cover hover:opacity-90" />
    </a>
  )
}
