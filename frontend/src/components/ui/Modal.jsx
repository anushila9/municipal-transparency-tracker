import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Accessible modal built on <dialog>: focus trapping, Esc to close and the backdrop come from the browser.
 * `busy` blocks closing while a request is in flight.
 */
export default function Modal({ open, onClose, title, description, children, footer, busy = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(e) => {
        // Clicks on the ::backdrop target the dialog element itself.
        if (e.target === ref.current && !busy) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-line bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-brand-950/50"
    >
      {open && (
        <div>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 id="modal-title" className="text-base font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="-m-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-slate-50/70 px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
