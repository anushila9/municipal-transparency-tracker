import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button.jsx'

export default function Pagination({ page, totalPages, totalElements, pageSize, onPage, noun = 'result' }) {
  if (!totalElements) return null
  const from = page * pageSize + 1
  const to = Math.min(totalElements, from + pageSize - 1)
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5" aria-label="Pagination">
      <p className="text-sm text-slate-600">
        {from}–{to} of {totalElements} {noun}
        {totalElements === 1 ? '' : 's'}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 0} onClick={() => onPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            {page + 1} / {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>
            Next
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </nav>
  )
}
