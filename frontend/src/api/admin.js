import { api, query } from './client.js'

export function login(email, password) {
  return api('/api/auth/login', { method: 'POST', body: { email, password } })
}

export function fetchMe(signal) {
  return api('/api/admin/me', { signal })
}

export function createProject(form) {
  return api('/api/admin/projects', { method: 'POST', body: form })
}

export function updateProject(id, form) {
  return api(`/api/admin/projects/${id}`, { method: 'PUT', body: form })
}

export function changeProjectStatus(id, status, note) {
  return api(`/api/admin/projects/${id}/status`, { method: 'POST', body: { status, note } })
}

export function deleteProject(id) {
  return api(`/api/admin/projects/${id}`, { method: 'DELETE' })
}

/** params: { state: ALL | OPEN | RESPONDED, projectId, page, size } */
export function fetchReports(params, signal) {
  return api(`/api/admin/reports${query(params)}`, { signal })
}

export function fetchReportCounts(signal) {
  return api('/api/admin/reports/counts', { signal })
}

export function respondToReport(id, response) {
  return api(`/api/admin/reports/${id}/response`, { method: 'PUT', body: { response } })
}

/** params: { entityType, entityId, page, size } */
export function fetchAudit(params, signal) {
  return api(`/api/admin/audit${query(params)}`, { signal })
}
