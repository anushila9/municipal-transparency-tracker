const TOKEN_KEY = 'egov.adminToken'
export const SESSION_EXPIRED_EVENT = 'egov:session-expired'

export class ApiError extends Error {
  constructor(message, status, fieldErrors = null) {
    super(message)
    this.status = status
    /** { field: message } from the backend's validation errors, when present. */
    this.fieldErrors = fieldErrors
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable (private mode); the session just won't persist.
  }
}

/** Expiry (ms since epoch) from the JWT's exp claim, or null if the token can't be read. */
export function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/** A token that is present, readable, and not yet expired. The backend still verifies it on every call. */
export function hasValidSession() {
  const token = getToken()
  if (!token) return false
  const exp = tokenExpiry(token)
  return exp !== null && exp > Date.now()
}

/** Ends the session and tells the admin shell to send the user to the login page with an explanation. */
export function expireSession() {
  setToken(null)
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

/**
 * fetch wrapper for the backend. Throws ApiError with the server's problem+json
 * "detail" when available, so pages can show a meaningful message.
 */
export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  // FormData (file uploads) sets its own multipart Content-Type with the boundary.
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const isAdmin = path.startsWith('/api/admin')
  const token = getToken()
  if (token && isAdmin) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(path, { method, headers, signal, body: body === undefined || isForm ? body : JSON.stringify(body) })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0)
  }

  if (!res.ok) {
    // An admin call rejected for auth means the token expired or was revoked: never fail silently.
    if (isAdmin && res.status === 401) {
      expireSession()
      throw new ApiError('Your session has expired. Please sign in again.', 401)
    }
    let message =
      res.status >= 502 && res.status <= 504
        ? 'The server is temporarily unavailable. Please try again in a moment.'
        : res.status >= 500
          ? 'Something went wrong on the server. Please try again.'
          : `Request failed (${res.status})`
    let fieldErrors = null
    try {
      const problem = await res.json()
      if (problem.detail) message = problem.detail
      if (problem.errors && typeof problem.errors === 'object') fieldErrors = problem.errors
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    if (res.status === 403) message = 'You do not have permission to do that.'
    if (res.status === 413 && !fieldErrors) message = 'The upload is too large. Photos must be 5 MB or smaller.'
    throw new ApiError(message, res.status, fieldErrors)
  }
  return res.status === 204 ? null : res.json()
}

/** Fetches an admin-only file (e.g. a report photo) with the session token and returns it as a Blob. */
export async function apiBlob(path, { signal } = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(path, { signal, headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Could not reach the server.', 0)
  }
  if (res.status === 401 && path.startsWith('/api/admin')) {
    expireSession()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }
  if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status)
  return res.blob()
}

/** Builds a query string, dropping empty values. */
export function query(params) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value)
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}
