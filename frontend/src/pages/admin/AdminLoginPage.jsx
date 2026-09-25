import { Link } from 'react-router'

// Placeholder: login form wiring (POST /api/auth/login) comes with the admin module.
export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-brand-700">Staff Login</h1>
        <p className="mt-2 text-sm text-slate-600">Admin login is coming in the admin module.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          ← Back to public site
        </Link>
      </div>
    </div>
  )
}
