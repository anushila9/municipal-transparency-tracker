import { Outlet, useNavigate } from 'react-router'
import { setToken } from '../api/client.js'

export default function AdminLayout() {
  const navigate = useNavigate()

  function logout() {
    setToken(null)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="font-semibold text-brand-700">Admin Panel</span>
          <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900">
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
