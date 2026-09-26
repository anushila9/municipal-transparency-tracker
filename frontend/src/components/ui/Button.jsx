import { Link } from 'react-router'
import Spinner from './Spinner.jsx'

const VARIANTS = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 disabled:bg-brand-700/60',
  secondary: 'border border-line bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-300',
  danger: 'bg-accent-700 text-white shadow-sm hover:bg-accent-600 disabled:bg-accent-700/60',
  ghost: 'text-slate-700 hover:bg-slate-900/5',
}

const SIZES = {
  sm: 'min-h-9 px-3 text-sm gap-1.5',
  md: 'min-h-11 px-4 text-sm gap-2',
}

export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}

/** Primary UI button. `loading` disables it and shows a spinner, so forms can't be double-submitted. */
export default function Button({ variant, size, loading = false, icon: Icon, children, className, disabled, type = 'button', ...rest }) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses({ variant, size, className })} {...rest}>
      {loading ? <Spinner className="h-4 w-4" /> : Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant, size, icon: Icon, children, className, ...rest }) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />}
      {children}
    </Link>
  )
}
