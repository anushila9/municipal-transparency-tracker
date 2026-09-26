import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-6">
      {back && (
        <Link to={back.to} className="-ml-1 mb-2 inline-flex min-h-9 items-center gap-1 px-1 text-sm font-medium text-brand-700 hover:underline">
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
