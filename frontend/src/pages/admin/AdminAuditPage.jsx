import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, X } from 'lucide-react'
import { fetchAudit } from '../../api/admin.js'
import { useRequest } from '../../api/useRequest.js'
import { useUrlParams } from '../../components/admin/useUrlParams.js'
import { ErrorState, TableSkeleton } from '../../components/States.jsx'
import Card from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Field.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import { formatNpr } from '../../lib/format.js'
import { SECTOR_LABELS, STATUS_LABELS } from '../../lib/labels.js'

const PAGE_SIZE = 25
const ENTITY_TYPES = [
  { value: 'Project', label: 'Projects' },
  { value: 'CitizenReport', label: 'Citizen reports' },
]
const FIELD_LABELS = {
  created: 'Created',
  deleted: 'Deleted',
  status: 'Status',
  title: 'Title',
  description: 'Description',
  wardNo: 'Ward',
  location: 'Location',
  sector: 'Sector',
  fiscalYear: 'Fiscal year',
  budgetAllocated: 'Approved budget',
  budgetSpent: 'Spent to date',
  startDate: 'Start date',
  targetEndDate: 'Target completion',
  adminResponse: 'Response',
}

const timeFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function AdminAuditPage() {
  const { params, set, clear, page } = useUrlParams()
  const entityType = params.get('entityType') ?? ''
  const entityId = entityType ? params.get('entityId') : null
  const key = `${entityType}|${entityId}|${page}`
  const { data, error, loading, reload } = useRequest(key, (signal) => fetchAudit({ entityType, entityId, page, size: PAGE_SIZE }, signal))

  return (
    <div>
      <PageHeader title="Audit log" description="A read-only record of every change made through the admin panel: who changed what, and when." />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4 sm:px-5">
          <label className="flex items-center gap-2 text-sm whitespace-nowrap text-slate-600">
            Record type
            <Select value={entityType} onChange={(e) => set('entityType', e.target.value)} options={ENTITY_TYPES} placeholder="All records" className="w-44" />
          </label>
          {entityId && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50 py-1 pr-1 pl-3 text-sm font-medium text-brand-800">
              {data?.content[0]?.entityLabel ?? `${entityType} #${entityId}`}
              <button onClick={() => clear(['entityType'])} className="grid h-7 w-7 place-items-center rounded-full hover:bg-brand-100" aria-label="Show all records of this type">
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>

        {error && !data ? (
          <div className="p-4 sm:p-5">
            <ErrorState message={error.message} onRetry={reload} />
          </div>
        ) : !data ? (
          <TableSkeleton label="Loading audit log" />
        ) : data.totalElements === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="font-medium text-slate-800">No changes recorded</p>
            <p className="mt-1 text-sm text-slate-500">Edits made in the admin panel will appear here.</p>
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : undefined} aria-busy={loading}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 whitespace-nowrap">When</th>
                    <th scope="col" className="px-3 py-2.5">Who</th>
                    <th scope="col" className="px-3 py-2.5">Record</th>
                    <th scope="col" className="px-3 py-2.5">Field</th>
                    <th scope="col" className="px-5 py-2.5">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line align-top">
                  {data.content.map((a) => (
                    <tr key={a.id}>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                        <time dateTime={a.changedAt}>{timeFmt.format(new Date(a.changedAt))}</time>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{a.changedBy}</td>
                      <td className="max-w-56 px-3 py-3">
                        <RecordLink entry={a} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-800">{FIELD_LABELS[a.fieldChanged] ?? a.fieldChanged}</td>
                      <td className="max-w-md px-5 py-3">
                        <Change entry={a} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {data.content.map((a) => (
                <li key={a.id} className="space-y-1.5 px-4 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-slate-800">{FIELD_LABELS[a.fieldChanged] ?? a.fieldChanged}</span>
                    <time dateTime={a.changedAt} className="shrink-0 text-xs text-slate-500">
                      {timeFmt.format(new Date(a.changedAt))}
                    </time>
                  </div>
                  <RecordLink entry={a} />
                  <Change entry={a} />
                  <p className="text-xs text-slate-500">by {a.changedBy}</p>
                </li>
              ))}
            </ul>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} pageSize={PAGE_SIZE} noun="entry" onPage={(p) => set('page', p > 0 ? String(p) : '')} />
          </div>
        )}
      </Card>
    </div>
  )
}

function RecordLink({ entry: a }) {
  const typeLabel = a.entityType === 'CitizenReport' ? 'Citizen report' : a.entityType
  const label = a.entityLabel ?? (a.fieldChanged === 'deleted' ? a.oldValue : null)
  const to = a.entityLabel && a.entityType === 'Project' ? `/admin/projects/${a.entityId}` : null
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">
        {typeLabel} #{a.entityId}
        {!a.entityLabel && ' · deleted'}
      </p>
      {label &&
        (to ? (
          <Link to={to} className="line-clamp-2 text-slate-800 hover:text-brand-700 hover:underline">
            {label}
          </Link>
        ) : (
          <p className="line-clamp-2 text-slate-600">{label}</p>
        ))}
    </div>
  )
}

function display(field, value) {
  if (value == null || value === '') return null
  if (field === 'status') return STATUS_LABELS[value] ?? value
  if (field === 'sector') return SECTOR_LABELS[value] ?? value
  if (field === 'budgetAllocated' || field === 'budgetSpent') return formatNpr(value)
  if (field === 'wardNo') return `Ward ${value}`
  return value
}

function Change({ entry: a }) {
  if (a.fieldChanged === 'created') return <span className="text-slate-600">Record created</span>
  if (a.fieldChanged === 'deleted') return <span className="font-medium text-accent-700">Record deleted</span>
  const before = display(a.fieldChanged, a.oldValue)
  const after = display(a.fieldChanged, a.newValue)
  return (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
      <Value text={before} tone="old" />
      <ArrowRight aria-label="changed to" className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <Value text={after} tone="new" />
    </div>
  )
}

/** Long values (descriptions, responses) are clamped with an expand toggle. */
function Value({ text, tone }) {
  const [open, setOpen] = useState(false)
  if (text == null) return <span className="text-slate-400 italic">empty</span>
  const long = String(text).length > 120
  const cls = tone === 'old' ? 'bg-slate-100 text-slate-600 line-through decoration-slate-400' : 'bg-emerald-50 text-emerald-900'
  return (
    <span className="min-w-0">
      <span className={`rounded px-1.5 py-0.5 break-words ${cls} ${long && !open ? 'line-clamp-2' : ''}`}>{text}</span>
      {long && (
        <button onClick={() => setOpen((o) => !o)} className="ml-1 text-xs font-medium text-brand-700 hover:underline">
          {open ? 'Less' : 'More'}
        </button>
      )}
    </span>
  )
}
