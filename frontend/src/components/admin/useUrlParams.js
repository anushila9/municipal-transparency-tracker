import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/** URL-backed filter state, so filtered admin views survive reloads and can be linked to. */
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const set = useCallback(
    (key, value) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          // Any filter change returns to the first page.
          if (key !== 'page') next.delete('page')
          return next
        },
        { replace: key === 'q' },
      ),
    [setSearchParams],
  )
  const clear = useCallback((keep = []) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams()
      for (const k of keep) if (prev.get(k)) next.set(k, prev.get(k))
      return next
    })
  }, [setSearchParams])
  return { params: searchParams, set, clear, page: Math.max(0, Number(searchParams.get('page')) || 0) }
}
