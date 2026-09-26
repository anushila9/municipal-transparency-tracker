import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { ExternalLink, FolderKanban, History, Inbox, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { fetchMe, fetchReportCounts } from '../api/admin.js'
import { expireSession, getToken, SESSION_EXPIRED_EVENT, setToken, tokenExpiry } from '../api/client.js'
import Brand from '../components/Brand.jsx'
import { DATA_DISCLAIMER } from '../lib/site.js'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/reports', label: 'Citizen reports', icon: Inbox, badge: 'openReports' },
  { to: '/admin/audit', label: 'Audit log', icon: History },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [reportCounts, setReportCounts] = useState(null)

  // Session expiry: either the token's own deadline passes, or the API rejects it (see api/client.js).
  useEffect(() => {
    function onExpired() {
      navigate('/admin/login', { replace: true, state: { reason: 'expired', from: location.pathname + location.search } })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    const exp = tokenExpiry(getToken())
    // setTimeout overflows past ~24.8 days; tokens here live hours, but clamp anyway.
    const timer = exp && setTimeout(expireSession, Math.min(Math.max(0, exp - Date.now()), 2 ** 31 - 1))
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
      if (timer) clearTimeout(timer)
    }
  }, [navigate, location.pathname, location.search])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchMe(ctrl.signal).then(setAdmin, () => {})
    return () => ctrl.abort()
  }, [])

  const refreshCounts = useCallback(() => {
    fetchReportCounts().then(setReportCounts, () => {})
  }, [])
  useEffect(refreshCounts, [refreshCounts])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  function logout() {
    setToken(null)
    navigate('/admin/login', { replace: true, state: { reason: 'signed-out' } })
  }

  const badges = { openReports: reportCounts?.open }

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <div className="border-t-4 border-accent-600 px-4 py-4">
        <Link to="/admin" className="block">
          <Brand subtitle="Municipal staff panel" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg border-l-4 px-3 text-sm font-medium transition-colors ${
                isActive ? 'border-accent-600 bg-white/12 text-white' : 'border-transparent text-white/75 hover:bg-white/6 hover:text-white'
              }`
            }
          >
            <Icon aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && badges[badge] > 0 && (
              <span className="rounded-full bg-accent-600 px-2 py-0.5 text-xs font-semibold text-white" aria-label={`${badges[badge]} open`}>
                {badges[badge]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 px-3 py-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/75 hover:bg-white/6 hover:text-white">
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          View public site
        </a>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold">
            {initials(admin?.name)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{admin?.name ?? 'Signed in'}</p>
            <p className="truncate text-xs text-white/60">{admin?.email ?? ' '}</p>
          </div>
          <button onClick={logout} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white" aria-label="Log out" title="Log out">
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile / tablet top bar and drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-t-4 border-accent-600 bg-brand-900 px-3 py-2 text-white lg:hidden">
        <Link to="/admin" className="min-w-0">
          <Brand subtitle="Municipal staff panel" />
        </Link>
        <button
          onClick={() => setMenuOpen(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg hover:bg-white/10"
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-brand-950/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            {sidebar}
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-2 grid h-10 w-10 place-items-center rounded-lg text-white/80 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet context={{ admin, reportCounts, refreshCounts }} />
        </main>
        <footer className="border-t border-line px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">{DATA_DISCLAIMER}</footer>
      </div>
    </div>
  )
}

function initials(name) {
  if (!name) return '·'
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
