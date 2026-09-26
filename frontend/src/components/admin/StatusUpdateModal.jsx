import { useState } from 'react'
import { changeProjectStatus } from '../../api/admin.js'
import { STATUS_LABELS, toOptions } from '../../lib/labels.js'
import StatusBadge from '../StatusBadge.jsx'
import Button from '../ui/Button.jsx'
import Field, { Select, Textarea } from '../ui/Field.jsx'
import Modal from '../ui/Modal.jsx'
import { useToast } from '../ui/Toast.jsx'

/** Status changes are recorded as StatusHistory entries (shown publicly), never as a silent field edit. */
export default function StatusUpdateModal({ project, open, onClose, onUpdated }) {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const options = toOptions(STATUS_LABELS).filter((o) => o.value !== project.status)

  function close() {
    setStatus('')
    setNote('')
    setError(null)
    onClose()
  }

  async function submit(e) {
    e.preventDefault()
    if (!status) {
      setError('Choose the new status.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await changeProjectStatus(project.id, status, note.trim() || null)
      toast.success(`Status changed to ${STATUS_LABELS[status]}.`)
      setStatus('')
      setNote('')
      onUpdated(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      busy={busy}
      title="Update project status"
      description="The change and your note appear in the project's public status history."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="status-form" loading={busy}>
            Record status change
          </Button>
        </>
      }
    >
      <form id="status-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          Current status: <StatusBadge status={project.status} />
        </div>
        <Field label="New status" required error={error && !status ? error : null}>
          {(p) => <Select {...p} value={status} onChange={(e) => setStatus(e.target.value)} options={options} placeholder="Select…" invalid={Boolean(error && !status)} />}
        </Field>
        <Field label="Note for the public record" hint="What changed on the ground? e.g. “Contractor mobilised; excavation started.”">
          {(p) => <Textarea {...p} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        {error && status && (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
