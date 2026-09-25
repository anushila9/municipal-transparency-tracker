import { Link, Outlet } from 'react-router'
import emblem from '../assets/emblem.png'
import { SITE_NAME } from '../lib/site.js'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={emblem} alt="Emblem of Nepal" width="47" height="44" className="h-11 w-auto shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-[15px] font-semibold min-[360px]:text-base">{SITE_NAME}</span>
              <span className="block text-xs text-white/80">Budget &amp; delivery transparency</span>
            </span>
          </Link>
          <Link to="/admin" className="-mr-2 inline-flex min-h-11 shrink-0 items-center px-2 text-sm text-white/80 hover:text-white">
            Staff login
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">
          Illustrative demo dataset. Figures do not represent official municipal records.
        </div>
      </footer>
    </div>
  )
}
