import { api } from './client.js'

export function fetchMeta(signal) {
  return api('/api/meta', { signal })
}

/** params: { ward, sector, status, fiscalYear, q, sort, page, size } — empty values are dropped. */
export function fetchProjects(params, signal) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value)
  }
  return api(`/api/projects?${qs}`, { signal })
}

export function fetchProject(id, signal) {
  return api(`/api/projects/${encodeURIComponent(id)}`, { signal })
}
