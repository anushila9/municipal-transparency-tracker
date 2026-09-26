import { Navigate, useLocation } from 'react-router'
import { getToken, hasValidSession } from '../api/client.js'

/**
 * Client-side gate for /admin/*. It checks the token synchronously before rendering, so protected
 * content never flashes for signed-out users. The backend enforces auth on every /api/admin call.
 */
export default function RequireAdmin({ children }) {
  const location = useLocation()
  if (hasValidSession()) return children

  // A leftover token means the session ran out (the login page clears it), rather than a first visit.
  const hadToken = Boolean(getToken())
  return (
    <Navigate
      to="/admin/login"
      replace
      state={{ from: location.pathname + location.search, reason: hadToken ? 'expired' : undefined }}
    />
  )
}
