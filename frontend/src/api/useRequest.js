import { useEffect, useState } from 'react'

/**
 * Runs `fetcher(signal)` whenever `key` changes and exposes { data, error, loading, reload }.
 * Each result remembers which request produced it, so "loading" is derived rather than stored,
 * and the previous data stays visible (dimmed by the caller) while the next page/filter loads.
 */
export function useRequest(key, fetcher) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${key}#${attempt}`
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const ctrl = new AbortController()
    fetcher(ctrl.signal).then(
      (data) => setResult({ key: requestKey, data, error: null }),
      (error) => {
        if (error.name !== 'AbortError') setResult((prev) => ({ key: requestKey, data: prev.data, error }))
      },
    )
    return () => ctrl.abort()
    // fetcher is recreated every render; requestKey captures everything it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const loading = result.key !== requestKey
  return {
    data: result.data,
    // Hide a stale error while a retry is in flight.
    error: loading ? null : result.error,
    loading,
    reload: () => setAttempt((n) => n + 1),
    /** Replace the data locally after a successful mutation, without refetching. */
    setData: (updater) => setResult((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater })),
  }
}
