import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'

const ToastContext = createContext(null)

/** App-wide toasts for save/update feedback. Errors stay until dismissed; successes fade after a few seconds. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (tone, message) => {
      const id = ++nextId.current
      setToasts((ts) => [...ts.slice(-2), { id, tone, message }])
      if (tone === 'success') setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ success: (m) => show('success', m), error: (m) => show('error', m) }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              t.tone === 'error' ? 'border-accent-100 bg-accent-50 text-accent-700' : 'border-emerald-200 bg-white text-slate-800'
            }`}
          >
            {t.tone === 'error' ? (
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CircleCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <p className="flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="-m-1 rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Dismiss">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
