export default function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`rounded-xl border border-line bg-white shadow-xs ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
