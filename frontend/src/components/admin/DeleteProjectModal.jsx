import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProject } from '../../api/admin.js'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import { useToast } from '../ui/Toast.jsx'

export default function DeleteProjectModal({ project, onClose, onDeleted }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await deleteProject(project.id)
      toast.success(`Deleted “${project.title}”.`)
      onDeleted(project)
    } catch (err) {
      setError(err.status === 404 ? 'This project was already deleted.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={Boolean(project)}
      onClose={() => {
        setError(null)
        onClose()
      }}
      busy={busy}
      title="Delete this project?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" icon={Trash2} loading={busy} onClick={confirm}>
            Delete project
          </Button>
        </>
      }
    >
      {project && (
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">{project.title}</span> will be removed from the public site, along with its status
            history and citizen reports. This cannot be undone.
          </p>
          <p className="text-slate-500">The deletion itself is recorded in the audit log.</p>
          {error && (
            <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-accent-700">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
