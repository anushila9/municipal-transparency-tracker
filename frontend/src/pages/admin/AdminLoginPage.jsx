import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { CircleAlert, Eye, EyeOff, Info, LockKeyhole } from 'lucide-react'
import { login } from '../../api/admin.js'
import { hasValidSession, setToken } from '../../api/client.js'
import Brand from '../../components/Brand.jsx'
import Button from '../../components/ui/Button.jsx'
import Field, { Input } from '../../components/ui/Field.jsx'
import { DATA_DISCLAIMER, SITE_NAME } from '../../lib/site.js'

const NOTICES = {
  expired: 'Your session has expired. Please sign in again to continue.',
  'signed-out': 'You have been signed out.',
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [alreadySignedIn] = useState(hasValidSession)

  useEffect(() => {
    document.title = `Staff sign in · ${SITE_NAME}`
    // Clear an expired or unreadable token so it isn't sent again.
    if (!alreadySignedIn) setToken(null)
    return () => {
      document.title = SITE_NAME
    }
  }, [alreadySignedIn])

  if (alreadySignedIn) return <Navigate to="/admin" replace />

  async function onSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await login(email.trim(), password)
      setToken(res.token)
      // Only return to admin pages, never an arbitrary URL.
      const from = typeof state?.from === 'string' && state.from.startsWith('/admin') ? state.from : '/admin'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect email or password. Check both and try again.' : err.message)
      setSubmitting(false)
    }
  }

  const notice = !error && NOTICES[state?.reason]

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-t-4 border-accent-600 bg-brand-900 p-10 text-white lg:flex">
        <Brand size="lg" />
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">Every approved rupee, accounted for in public.</h2>
          <p className="mt-4 text-white/75">
            Record project budgets, spending and progress, respond to citizens, and keep a complete audit trail of every change.
          </p>
        </div>
        <p className="text-xs text-white/60">{DATA_DISCLAIMER}</p>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full border-[40px] border-white/5" />
      </section>

      <section className="flex flex-col">
        <div className="border-t-4 border-accent-600 bg-brand-900 px-4 py-3 text-white lg:hidden">
          <Brand />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <LockKeyhole aria-hidden="true" className="h-5 w-5" />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Staff sign in</h1>
              <p className="mt-1 text-sm text-slate-600">For authorised municipal staff only. Citizens don't need an account.</p>
            </div>

            {notice && (
              <div role="status" className="mb-4 flex gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
                <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}
            {error && (
              <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-accent-100 bg-accent-50 px-3 py-2.5 text-sm text-accent-700">
                <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <Field label="Email">
                {(p) => (
                  <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} invalid={Boolean(error)} autoFocus />
                )}
              </Field>
              <Field label="Password">
                {(p) => (
                  <div className="relative">
                    <Input
                      {...p}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      invalid={Boolean(error)}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-800"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </Field>
              <Button type="submit" loading={submitting} className="w-full">
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <Link to="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline">
              ← Back to the public site
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
