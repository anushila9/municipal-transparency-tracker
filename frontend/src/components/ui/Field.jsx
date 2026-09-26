import { useId } from 'react'

const CONTROL =
  'w-full rounded-lg border bg-white px-3 py-2 text-base text-slate-900 shadow-xs placeholder:text-slate-400 sm:text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500'
const OK = 'border-slate-300 focus:border-brand-600 focus:ring-brand-100'
const BAD = 'border-accent-600 focus:border-accent-600 focus:ring-accent-100'

export function controlClasses(invalid, extra = '') {
  return `${CONTROL} ${invalid ? BAD : OK} ${extra}`
}

/**
 * Label + control + hint/error, wired up with ids for screen readers.
 * `children` is a render function receiving the props the control needs.
 */
export default function Field({ label, name, hint, error, required, className = '', children }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    // `name` gives the wrapper a stable id (field-<name>) so forms can scroll to the first error.
    <div id={name ? `field-${name}` : undefined} className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
        {required && (
          <span className="text-accent-700" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      <div className="mt-1.5">{children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}</div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-accent-700">
          {error}
        </p>
      )}
    </div>
  )
}

export function Input({ invalid, className, ...rest }) {
  return <input className={controlClasses(invalid, `min-h-11 ${className ?? ''}`)} {...rest} />
}

export function Textarea({ invalid, className, ...rest }) {
  return <textarea className={controlClasses(invalid, className)} {...rest} />
}

export function Select({ invalid, className, options, placeholder, ...rest }) {
  return (
    <select className={controlClasses(invalid, `min-h-11 pr-8 ${className ?? ''}`)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
