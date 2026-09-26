import { api, query } from './client.js'

export function fetchMeta(signal) {
  return api('/api/meta', { signal })
}

/** params: { ward, sector, status, fiscalYear, q, sort, page, size } — empty values are dropped. */
export function fetchProjects(params, signal) {
  return api(`/api/projects${query(params)}`, { signal })
}

export function fetchProject(id, signal) {
  return api(`/api/projects/${encodeURIComponent(id)}`, { signal })
}

export function fetchStats(fiscalYear, signal) {
  return api(`/api/stats${query({ fiscalYear })}`, { signal })
}

/** Public citizen report. `form` is FormData with comment, optional reporterName / photo, and the website honeypot. */
export function submitReport(projectId, form) {
  return api(`/api/projects/${encodeURIComponent(projectId)}/reports`, { method: 'POST', body: form })
}
