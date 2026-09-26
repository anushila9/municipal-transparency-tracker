import { useEffect, useRef, useState } from 'react'
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router'
import { ArrowUpRight, History, Inbox, RefreshCw, Save, Trash2 } from 'lucide-react'
import { createProject, updateProject } from '../../api/admin.js'
import { fetchProject } from '../../api/projects.js'
import { useMeta } from '../../api/useMeta.js'
import { useRequest } from '../../api/useRequest.js'
import DeleteProjectModal from '../../components/admin/DeleteProjectModal.jsx'
import StatusUpdateModal from '../../components/admin/StatusUpdateModal.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { ErrorState } from '../../components/States.jsx'
import Button, { ButtonLink } from '../../components/ui/Button.jsx'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import Field, { Input, Select, Textarea } from '../../components/ui/Field.jsx'
import Modal from '../../components/ui/Modal.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { formatDate, formatNpr, formatNprShort } from '../../lib/format.js'
import { SECTOR_LABELS, STATUS_LABELS, toOptions } from '../../lib/labels.js'
import { SITE_NAME } from '../../lib/site.js'

const EMPTY = {
  title: '',
  description: '',
  wardNo: '',
  location: '',
  sector: '',
  fiscalYear: '',
  budgetAllocated: '',
  budgetSpent: '0',
  startDate: '',
  targetEndDate: '',
  status: 'NOT_STARTED',
  statusNote: '',
}

const EDITABLE = Object.keys(EMPTY).filter((k) => k !== 'status' && k !== 'statusNote')

export default function AdminProjectFormPage() {
  const { id } = useParams()
  return id ? <EditProject key={id} id={id} /> : <ProjectForm key="new" />
}

function EditProject({ id }) {
  const { data, error, loading, reload, setData } = useRequest(id, (signal) => fetchProject(id, signal))

  if (error && !data) {
    const missing = error.status === 404 || error.status === 400
    return (
      <div>
        <PageHeader title={missing ? 'Project not found' : 'Edit project'} back={{ to: '/admin/projects', label: 'All projects' }} />
        {missing ? (
          <Card className="p-10 text-center">
            <p className="font-medium text-slate-800">This project doesn't exist or has been deleted.</p>
            <ButtonLink to="/admin/projects" variant="secondary" className="mt-4">
              Back to projects
            </ButtonLink>
          </Card>
        ) : (
          <ErrorState message={error.message} onRetry={reload} />
        )}
      </div>
    )
  }
  if (loading && !data) return <FormSkeleton />
  return <ProjectForm project={data} onSaved={setData} />
}

function toValues(p) {
  if (!p) return EMPTY
  return {
    ...EMPTY,
    title: p.title ?? '',
    description: p.description ?? '',
    wardNo: String(p.wardNo ?? ''),
    location: p.location ?? '',
    sector: p.sector ?? '',
    fiscalYear: p.fiscalYear ?? '',
    budgetAllocated: p.budgetAllocated != null ? String(Number(p.budgetAllocated)) : '',
    budgetSpent: p.budgetSpent != null ? String(Number(p.budgetSpent)) : '0',
    startDate: p.startDate ?? '',
    targetEndDate: p.targetEndDate ?? '',
    status: p.status,
  }
}

function validate(v) {
  const e = {}
  if (!v.title.trim()) e.title = 'Enter a project title.'
  else if (v.title.trim().length > 200) e.title = 'Keep the title under 200 characters.'
  if (!v.sector) e.sector = 'Choose a sector.'
  const ward = Number(v.wardNo)
  if (!v.wardNo) e.wardNo = 'Enter the ward number.'
  else if (!Number.isInteger(ward) || ward < 1 || ward > 99) e.wardNo = 'Ward must be a whole number between 1 and 99.'
  if (!/^\d{4}\/\d{2}$/.test(v.fiscalYear.trim())) e.fiscalYear = 'Use the Bikram Sambat format, e.g. 2083/84.'
  for (const [k, label] of [['budgetAllocated', 'approved budget'], ['budgetSpent', 'amount spent']]) {
    if (v[k] === '') e[k] = `Enter the ${label} (0 if none).`
    else if (!/^\d+(\.\d{1,2})?$/.test(v[k])) e[k] = 'Enter an amount in rupees, e.g. 1250000 or 1250000.50.'
  }
  if (v.startDate && v.targetEndDate && v.targetEndDate < v.startDate) e.targetEndDate = 'Target completion must be on or after the start date.'
  return e
}

function toPayload(v, includeStatus) {
  const orNull = (s) => (s.trim() === '' ? null : s.trim())
  return {
    title: v.title.trim(),
    description: orNull(v.description),
    wardNo: Number(v.wardNo),
    location: orNull(v.location),
    sector: v.sector,
    fiscalYear: v.fiscalYear.trim(),
    budgetAllocated: v.budgetAllocated,
    budgetSpent: v.budgetSpent,
    startDate: v.startDate || null,
    targetEndDate: v.targetEndDate || null,
    ...(includeStatus ? { status: v.status, statusNote: orNull(v.statusNote) } : {}),
  }
}

function ProjectForm({ project, onSaved }) {
  const isNew = !project
  const navigate = useNavigate()
  const toast = useToast()
  const meta = useMeta()
  const [initial, setInitial] = useState(() => toValues(project))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  // A ref, not state: it must take effect for the navigate() call made in the same tick.
  const skipBlock = useRef(false)

  const dirty = EDITABLE.some((k) => values[k] !== initial[k]) || (isNew && values.statusNote !== '')

  useEffect(() => {
    document.title = `${isNew ? 'New project' : `Edit: ${project.title}`} · ${SITE_NAME}`
    return () => {
      document.title = SITE_NAME
    }
  }, [isNew, project?.title])

  // Warn before losing unsaved edits (in-app navigation and tab close). Never block a session-expiry redirect.
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    dirty && !skipBlock.current && currentLocation.pathname !== nextLocation.pathname && nextLocation.pathname !== '/admin/login',
  )
  useBeforeUnload((e) => {
    if (dirty) e.preventDefault()
  })

  function setField(k, v) {
    setValues((prev) => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    setSaveError(null)
    if (Object.keys(found).length) {
      document.getElementById(`field-${Object.keys(found)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const created = await createProject(toPayload(values, true))
        toast.success('Project created and published.')
        skipBlock.current = true
        navigate(`/admin/projects/${created.id}`, { replace: true })
      } else {
        const updated = await updateProject(project.id, toPayload(values, false))
        const next = toValues(updated)
        setInitial(next)
        setValues(next)
        onSaved(updated)
        toast.success('Changes saved.')
      }
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors)
      setSaveError(err.status === 404 ? 'This project no longer exists; it may have been deleted by someone else.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  const sectors = meta?.sectors ?? toOptions(SECTOR_LABELS)
  const err = (k) => errors[k]

  return (
    <div>
      <PageHeader
        title={isNew ? 'New project' : 'Edit project'}
        description={isNew ? 'Record an approved project. It appears on the public site as soon as it is saved.' : project.title}
        back={{ to: '/admin/projects', label: 'All projects' }}
        actions={
          !isNew && (
            <>
              {/* On small screens the status panel sits below the form, so surface the action up here too. */}
              <Button variant="secondary" icon={RefreshCw} className="lg:hidden" onClick={() => setStatusOpen(true)}>
                Update status
              </Button>
              <ButtonLink to={`/projects/${project.id}`} target="_blank" variant="secondary" icon={ArrowUpRight}>
                View public page
              </ButtonLink>
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={onSubmit} noValidate className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Project details" />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Title" required name="title" error={err('title')} className="sm:col-span-2">
                {(p) => <Input {...p} value={values.title} maxLength={200} onChange={(e) => setField('title', e.target.value)} invalid={!!err('title')} />}
              </Field>
              <Field label="Description" hint="Scope of work as approved, e.g. length, specification, beneficiaries." error={err('description')} className="sm:col-span-2">
                {(p) => <Textarea {...p} rows={4} maxLength={4000} value={values.description} onChange={(e) => setField('description', e.target.value)} invalid={!!err('description')} />}
              </Field>
              <Field label="Sector" required name="sector" error={err('sector')}>
                {(p) => <Select {...p} value={values.sector} onChange={(e) => setField('sector', e.target.value)} options={sectors} placeholder="Select a sector…" invalid={!!err('sector')} />}
              </Field>
              <Field label="Fiscal year" required hint="Bikram Sambat, e.g. 2083/84" name="fiscalYear" error={err('fiscalYear')}>
                {(p) => (
                  <Input {...p} value={values.fiscalYear} maxLength={7} placeholder="2083/84" inputMode="numeric" list="fy-options" onChange={(e) => setField('fiscalYear', e.target.value)} invalid={!!err('fiscalYear')} />
                )}
              </Field>
              <datalist id="fy-options">
                {(meta?.fiscalYears ?? []).map((fy) => (
                  <option key={fy} value={fy} />
                ))}
              </datalist>
              <Field label="Ward no." required name="wardNo" error={err('wardNo')}>
                {(p) => <Input {...p} type="number" min={1} max={99} inputMode="numeric" value={values.wardNo} onChange={(e) => setField('wardNo', e.target.value)} invalid={!!err('wardNo')} />}
              </Field>
              <Field label="Location" hint="Tole or landmark" name="location" error={err('location')}>
                {(p) => <Input {...p} value={values.location} maxLength={160} onChange={(e) => setField('location', e.target.value)} invalid={!!err('location')} />}
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Budget" description="Amounts in Nepali rupees. Update spending as payments are released." />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <AmountField label="Approved budget" name="budgetAllocated" value={values.budgetAllocated} error={err('budgetAllocated')} onChange={setField} />
              <AmountField label="Spent to date" name="budgetSpent" value={values.budgetSpent} error={err('budgetSpent')} onChange={setField} />
              <UtilisationPreview allocated={values.budgetAllocated} spent={values.budgetSpent} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Start date" name="startDate" error={err('startDate')}>
                {(p) => <Input {...p} type="date" value={values.startDate} onChange={(e) => setField('startDate', e.target.value)} invalid={!!err('startDate')} />}
              </Field>
              <Field label="Target completion" name="targetEndDate" error={err('targetEndDate')}>
                {(p) => <Input {...p} type="date" min={values.startDate || undefined} value={values.targetEndDate} onChange={(e) => setField('targetEndDate', e.target.value)} invalid={!!err('targetEndDate')} />}
              </Field>
            </div>
          </Card>

          {isNew && (
            <Card>
              <CardHeader title="Initial status" description="Recorded as the first entry in the project's public status history." />
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <Field label="Status" required>
                  {(p) => <Select {...p} value={values.status} onChange={(e) => setField('status', e.target.value)} options={toOptions(STATUS_LABELS)} />}
                </Field>
                <Field label="Note" hint="e.g. “Approved by ward assembly; tender notice published.”" className="sm:col-span-2">
                  {(p) => <Textarea {...p} rows={2} maxLength={1000} value={values.statusNote} onChange={(e) => setField('statusNote', e.target.value)} />}
                </Field>
              </div>
            </Card>
          )}

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-white/95 sm:px-5">
            <div className="min-w-0 text-sm" aria-live="polite">
              {saveError ? (
                <span role="alert" className="font-medium text-accent-700">{saveError}</span>
              ) : Object.values(errors).some(Boolean) ? (
                <span className="font-medium text-accent-700">Fix the highlighted fields to save.</span>
              ) : dirty ? (
                <span className="text-slate-600">Unsaved changes</span>
              ) : (
                <span className="text-slate-500">{isNew ? 'Fill in the details above.' : `Last saved ${formatDate(project.updatedAt)}`}</span>
              )}
            </div>
            <div className="flex gap-2">
              <ButtonLink to="/admin/projects" variant="secondary">
                Cancel
              </ButtonLink>
              <Button type="submit" icon={Save} loading={saving} disabled={!isNew && !dirty}>
                {isNew ? 'Create project' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>

        {!isNew && (
          <aside className="space-y-6">
            <Card>
              <CardHeader title="Status" />
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={project.status} />
                  {project.overdue && <span className="text-xs font-medium text-accent-700">Overdue</span>}
                </div>
                <p className="mt-2 text-sm text-slate-600">Status changes are logged with a note and shown in the public status history.</p>
                <Button variant="secondary" icon={RefreshCw} className="mt-4 w-full" onClick={() => setStatusOpen(true)}>
                  Update status
                </Button>
              </div>
            </Card>

            <StatusTimeline history={project.statusHistory} />

            <Card>
              <CardHeader title="Records" />
              <ul className="divide-y divide-line text-sm">
                <li>
                  <Link to={`/admin/reports?projectId=${project.id}`} className="flex min-h-12 items-center gap-3 px-4 hover:bg-slate-50 sm:px-5">
                    <Inbox aria-hidden="true" className="h-4 w-4 text-slate-400" /> Citizen reports on this project
                  </Link>
                </li>
                <li>
                  <Link to={`/admin/audit?entityType=Project&entityId=${project.id}`} className="flex min-h-12 items-center gap-3 px-4 hover:bg-slate-50 sm:px-5">
                    <History aria-hidden="true" className="h-4 w-4 text-slate-400" /> Audit trail for this project
                  </Link>
                </li>
                <li>
                  <button onClick={() => setDeleteOpen(true)} className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-accent-700 hover:bg-accent-50 sm:px-5">
                    <Trash2 aria-hidden="true" className="h-4 w-4" /> Delete project
                  </button>
                </li>
              </ul>
            </Card>
          </aside>
        )}
      </div>

      {!isNew && (
        <>
          <StatusUpdateModal
            project={project}
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            onUpdated={(updated) => {
              setStatusOpen(false)
              onSaved(updated)
            }}
          />
          <DeleteProjectModal
            project={deleteOpen ? project : null}
            onClose={() => setDeleteOpen(false)}
            onDeleted={() => {
              skipBlock.current = true
              navigate('/admin/projects', { replace: true })
            }}
          />
        </>
      )}

      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved changes?"
        footer={
          <>
            <Button variant="secondary" onClick={() => blocker.reset?.()}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              Discard changes
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">You have edits that haven't been saved. If you leave now, they will be lost.</p>
      </Modal>
    </div>
  )
}

function AmountField({ label, name, value, error, onChange }) {
  const valid = /^\d+(\.\d{1,2})?$/.test(value)
  return (
    <Field label={label} name={name} required error={error} hint={valid ? `${formatNpr(value)}${Number(value) >= 1e5 ? ` (${formatNprShort(value).replace('Rs. ', '')})` : ''}` : 'Rupees, up to 2 decimal places'}>
      {(p) => (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500">Rs.</span>
          <Input {...p} inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(name, e.target.value.replace(/[,\s]/g, ''))} invalid={!!error} className="pl-10 tabular-nums" />
        </div>
      )}
    </Field>
  )
}

function UtilisationPreview({ allocated, spent }) {
  const a = Number(allocated)
  const s = Number(spent)
  if (!(a > 0) || Number.isNaN(s)) return null
  const pct = Math.round((s / a) * 1000) / 10
  const over = pct > 100
  return (
    <div className="sm:col-span-2">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className={`h-full rounded-full ${over ? 'bg-accent-600' : 'bg-brand-600'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className={`mt-1.5 text-xs ${over ? 'font-medium text-accent-700' : 'text-slate-500'}`}>
        {pct}% of the approved budget used
        {over && ' (over budget, which will be shown publicly)'}
      </p>
    </div>
  )
}

function StatusTimeline({ history }) {
  return (
    <Card>
      <CardHeader title="Status history" />
      {history.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No status changes recorded yet.</p>
      ) : (
        <ol className="relative mx-5 my-5 space-y-5 border-l-2 border-line pl-5">
          {[...history].reverse().map((h, i) => (
            <li key={`${h.changedAt}-${i}`} className="relative">
              <span aria-hidden="true" className={`absolute top-1 -left-[27px] h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? 'bg-brand-600' : 'bg-slate-300'}`} />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusBadge status={h.newStatus} />
                {h.previousStatus && <span className="text-xs text-slate-500">from {STATUS_LABELS[h.previousStatus]}</span>}
              </div>
              {h.note && <p className="mt-1.5 text-sm text-slate-700">{h.note}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(h.changedAt)} · {h.changedBy}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function FormSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading project">
      <div className="mb-6 space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-7 w-64 rounded bg-slate-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-80 rounded-xl border border-line bg-white" />
          <div className="h-44 rounded-xl border border-line bg-white" />
        </div>
        <div className="h-64 rounded-xl border border-line bg-white" />
      </div>
    </div>
  )
}
