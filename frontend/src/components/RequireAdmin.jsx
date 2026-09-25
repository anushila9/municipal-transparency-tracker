import { Navigate } from 'react-router'
import { getToken } from '../api/client.js'

/**
 * Client-side gate only, for navigation. The backend enforces auth on every /api/admin call.
 */
export default function RequireAdmin({ children }) {
  return getToken() ? children : <Navigate to="/admin/login" replace />
}
