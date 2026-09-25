import { STATUS_LABELS, STATUS_STYLES } from '../lib/labels.js'

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] ?? STATUS_STYLES.NOT_STARTED}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
