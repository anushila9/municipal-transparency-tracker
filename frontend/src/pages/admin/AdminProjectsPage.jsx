import { useState } from 'react'
import { Link } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { fetchProjects } from '../../api/projects.js'
import { useMeta } from '../../api/useMeta.js'
import { useRequest } from '../../api/useRequest.js'
import DeleteProjectModal from '../../components/admin/DeleteProjectModal.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import { useUrlParams } from '../../components/admin/useUrlParams.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { ErrorState, TableSkeleton } from '../../components/States.jsx'
import Button, { ButtonLink } from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Field.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import { formatDate, formatNprShort } from '../../lib/format.js'
import { SECTOR_LABELS, STATUS_LABELS, toOptions } from '../../lib/labels.js'

const PAGE_SIZE = 20
const FILTERS = ['q', 'ward', 'sector', 'status', 'fiscalYear']
const SORTS = [
  { value: 'RECENT', label: 'Recently updated' },
  { value: 'TITLE', label: 'Title (A–Z)' },
  { value: 'BUDGET_DESC', label: 'Budget: high to low' },
  { value: 'BUDGET_ASC', label: 'Budget: low to high' },
]

export default function AdminProjectsPage() {
  const meta = useMeta()
  const { params, set, clear, page } = useUrlParams()
  const [toDelete, setToDelete] = useState(null)
  const key = params.toString()
  const { data, error, loading, reload } = useRequest(key, (signal) =>
    fetchProjects({ ...Object.fromEntries(new URLSearchParams(key)), size: PAGE_SIZE }, signal),
  )
  const hasFilters = FILTERS.some((k) => params.get(k))

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Create, edit and update the status of development projects."
        actions={
          <ButtonLink to="/admin/projects/new" icon={Plus}>
            New project
          </ButtonLink>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <SearchInput value={params.get('q') ?? ''} onChange={(v) => set('q', v)} placeholder="Search title or location…" label="Search projects" />
          </div>
          <FilterSelect label="Ward" value={params.get('ward')} onChange={(v) => set('ward', v)} all="All wards"
            options={(meta?.wards ?? []).map((w) => ({ value: String(w), label: `Ward ${w}` }))} />
          <FilterSelect label="Sector" value={params.get('sector')} onChange={(v) => set('sector', v)} all="All sectors" options={meta?.sectors ?? toOptions(SECTOR_LABELS)} />
          <FilterSelect label="Status" value={params.get('status')} onChange={(v) => set('status', v)} all="All statuses" options={meta?.statuses ?? toOptions(STATUS_LABELS)} />
          <FilterSelect label="Fiscal year" value={params.get('fiscalYear')} onChange={(v) => set('fiscalYear', v)} all="All years"
            options={(meta?.fiscalYears ?? []).map((fy) => ({ value: fy, label: `FY ${fy}` }))} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2 sm:px-5">
          <p className="text-sm text-slate-600" aria-live="polite">
            {data ? `${data.totalElements} project${data.totalElements === 1 ? '' : 's'}${hasFilters ? ' match' : ''}` : ' '}
            {hasFilters && (
              <button onClick={() => clear(['sort'])} className="ml-2 min-h-9 font-medium text-brand-700 hover:underline">
                Clear filters
              </button>
            )}
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Sort
            <select
              value={params.get('sort') ?? 'RECENT'}
              onChange={(e) => set('sort', e.target.value === 'RECENT' ? '' : e.target.value)}
              className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="p-4 sm:p-5">
            <ErrorState message={error.message} onRetry={reload} />
          </div>
        ) : !data ? (
          <TableSkeleton label="Loading projects" />
        ) : data.totalElements === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="font-medium text-slate-800">{hasFilters ? 'No projects match these filters' : 'No projects yet'}</p>
            <p className="mt-1 text-sm text-slate-500">{hasFilters ? 'Try a different search or clear the filters.' : 'Add a project to start tracking its budget and progress.'}</p>
            <div className="mt-4">
              {hasFilters ? (
                <Button variant="secondary" onClick={() => clear()}>
                  Clear filters
                </Button>
              ) : (
                <ButtonLink to="/admin/projects/new" icon={Plus}>
                  Add a project
                </ButtonLink>
              )}
            </div>
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : undefined} aria-busy={loading}>
            <ProjectTable projects={data.content} onDelete={setToDelete} />
            <ProjectCards projects={data.content} onDelete={setToDelete} />
            <Pagination
              page={page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={PAGE_SIZE}
              noun="project"
              onPage={(p) => set('page', p > 0 ? String(p) : '')}
            />
          </div>
        )}
      </Card>

      <DeleteProjectModal
        project={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={() => {
          setToDelete(null)
          // If the last row on a page was deleted, step back a page.
          if (data?.content.length === 1 && page > 0) set('page', page - 1 > 0 ? String(page - 1) : '')
          else reload()
        }}
      />
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, all }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)} options={options} placeholder={all} aria-label={label} />
    </label>
  )
}

function ProjectTable({ projects, onDelete }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-2.5">Project</th>
            <th scope="col" className="px-3 py-2.5">Sector</th>
            <th scope="col" className="px-3 py-2.5">Status</th>
            <th scope="col" className="px-3 py-2.5">Budget used</th>
            <th scope="col" className="px-3 py-2.5 whitespace-nowrap">Updated</th>
            <th scope="col" className="px-5 py-2.5 text-right"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/70">
              <td className="max-w-xs px-5 py-3">
                <Link to={`/admin/projects/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">
                  {p.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ward {p.wardNo}
                  {p.location && ` · ${p.location}`} · FY {p.fiscalYear}
                </p>
              </td>
              <td className="px-3 py-3 text-slate-700">{SECTOR_LABELS[p.sector] ?? p.sector}</td>
              <td className="px-3 py-3">
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge status={p.status} />
                  {p.overdue && <span className="text-xs font-medium text-accent-700">Overdue</span>}
                </div>
              </td>
              <td className="w-56 min-w-52 px-3 py-3">
                <MiniBudget project={p} />
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatDate(p.updatedAt)}</td>
              <td className="px-5 py-3">
                <RowActions project={p} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProjectCards({ projects, onDelete }) {
  return (
    <ul className="divide-y divide-line md:hidden">
      {projects.map((p) => (
        <li key={p.id} className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <Link to={`/admin/projects/${p.id}`} className="min-w-0 font-medium text-slate-900 hover:text-brand-700">
              {p.title}
            </Link>
            <StatusBadge status={p.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {SECTOR_LABELS[p.sector] ?? p.sector} · Ward {p.wardNo} · FY {p.fiscalYear}
            {p.overdue && <span className="font-medium text-accent-700"> · Overdue</span>}
          </p>
          <div className="mt-3">
            <MiniBudget project={p} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">Updated {formatDate(p.updatedAt)}</span>
            <RowActions project={p} onDelete={onDelete} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function MiniBudget({ project: p }) {
  const pct = Number(p.utilizationPercent)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium whitespace-nowrap text-slate-800">{formatNprShort(p.budgetSpent)}</span>
        <span className="whitespace-nowrap text-slate-500">of {formatNprShort(p.budgetAllocated)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
        <div className={`h-full rounded-full ${pct > 100 ? 'bg-accent-600' : 'bg-brand-600'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

function RowActions({ project, onDelete }) {
  return (
    <div className="flex justify-end gap-1">
      <Link
        to={`/admin/projects/${project.id}`}
        className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-brand-50 hover:text-brand-700"
        aria-label={`Edit ${project.title}`}
        title="Edit"
      >
        <Pencil aria-hidden="true" className="h-4 w-4" />
      </Link>
      <button
        onClick={() => onDelete(project)}
        className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-accent-50 hover:text-accent-700"
        aria-label={`Delete ${project.title}`}
        title="Delete"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
