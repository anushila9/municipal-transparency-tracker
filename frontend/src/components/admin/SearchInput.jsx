import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { controlClasses } from '../ui/Field.jsx'

/** Debounced search box that stays in sync when the URL changes externally (back button, "clear"). */
export default function SearchInput({ value, onChange, placeholder, label = 'Search' }) {
  const [text, setText] = useState(value)
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    if (value !== text.trim()) setText(value)
  }

  useEffect(() => {
    if (text.trim() === value) return
    const t = setTimeout(() => onChange(text.trim()), 300)
    return () => clearTimeout(t)
  }, [text, value, onChange])

  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={text}
        maxLength={100}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className={controlClasses(false, 'min-h-11 pl-9')}
      />
    </label>
  )
}
