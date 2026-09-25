import { useEffect, useState } from 'react'
import { fetchMeta } from './projects.js'

// Fetched once per page load and shared by every component that needs filter options.
let metaPromise = null

export function useMeta() {
  const [meta, setMeta] = useState(null)
  useEffect(() => {
    let active = true
    metaPromise ??= fetchMeta().catch((err) => {
      metaPromise = null // Allow a later mount to retry.
      throw err
    })
    // Non-critical: callers fall back to defaults when meta is unavailable.
    metaPromise.then((m) => active && setMeta(m), () => {})
    return () => {
      active = false
    }
  }, [])
  return meta
}
