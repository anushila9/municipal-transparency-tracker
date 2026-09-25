// Fallback labels; the backend's /api/meta is the source of truth for filter options.
export const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  STALLED: 'Stalled',
  COMPLETED: 'Completed',
}

export const SECTOR_LABELS = {
  ROADS: 'Roads & Transport',
  DRINKING_WATER: 'Drinking Water',
  EDUCATION: 'Education',
  DRAINAGE: 'Drainage & Sanitation',
}

export const STATUS_STYLES = {
  NOT_STARTED: 'bg-slate-100 text-slate-700 ring-slate-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-800 ring-blue-200',
  STALLED: 'bg-amber-50 text-amber-900 ring-amber-300',
  COMPLETED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
}
