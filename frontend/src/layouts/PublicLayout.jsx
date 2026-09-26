import { Link, Outlet } from 'react-router'
import Brand from '../components/Brand.jsx'
import { DATA_DISCLAIMER } from '../lib/site.js'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-t-4 border-accent-600 bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
          <Link to="/" className="min-w-0">
            <Brand />
          </Link>
          <Link to="/admin" className="-mr-2 inline-flex min-h-11 shrink-0 items-center px-2 text-sm text-white/80 hover:text-white">
            Staff login
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">{DATA_DISCLAIMER}</div>
      </footer>
    </div>
  )
}
