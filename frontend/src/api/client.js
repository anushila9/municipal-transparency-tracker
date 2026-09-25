const TOKEN_KEY = 'egov.adminToken'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
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

/**
 * fetch wrapper for the backend. Throws ApiError with the server's problem+json
 * "detail" when available, so pages can show a meaningful message.
 */
export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token && path.startsWith('/api/admin')) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(path, { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const problem = await res.json()
      if (problem.detail) message = problem.detail
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(message, res.status)
  }
  return res.status === 204 ? null : res.json()
}
