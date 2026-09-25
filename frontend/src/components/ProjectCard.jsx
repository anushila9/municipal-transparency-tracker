import { Link, useLocation } from 'react-router'
import { formatDate } from '../lib/format.js'
import { SECTOR_LABELS } from '../lib/labels.js'
import BudgetBar from './BudgetBar.jsx'
import StatusBadge from './StatusBadge.jsx'

export default function ProjectCard({ project }) {
  const { search } = useLocation()
  return (
    <Link
      to={`/projects/${project.id}`}
      // Remember the list's filters so "back to projects" returns to the same view.
      state={{ listSearch: search }}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-600"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{SECTOR_LABELS[project.sector] ?? project.sector}</span>
        <StatusBadge status={project.status} />
      </div>

      <h3 className="mt-2 font-semibold leading-snug text-slate-900 group-hover:text-brand-700">{project.title}</h3>
      <p className="mt-1 text-sm text-slate-500">
        Ward {project.wardNo}
        {project.location && ` · ${project.location}`} · FY {project.fiscalYear}
      </p>

      <div className="mt-4 mb-4">
        <BudgetBar allocated={project.budgetAllocated} spent={project.budgetSpent} percent={project.utilizationPercent} />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Target: {formatDate(project.targetEndDate)}</span>
        {project.overdue && <span className="rounded bg-red-50 px-1.5 py-0.5 font-medium text-red-700">Overdue</span>}
      </div>
    </Link>
  )
}
