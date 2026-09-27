import { useEffect, useRef, useState } from 'react'
import { Camera, CircleAlert, CircleCheck, ImageOff, Send, X } from 'lucide-react'
import { submitReport } from '../api/projects.js'
import Button from './ui/Button.jsx'
import Field, { Input, Textarea } from './ui/Field.jsx'

// Mirrors the server's limits (ReportSubmissionService) for instant feedback; the server remains the authority.
const COMMENT_MIN = 10
const COMMENT_MAX = 2000
const NAME_MAX = 120
const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png']

function validate({ comment, name, photo }) {
  const e = {}
  const c = comment.trim()
  if (!c) e.comment = 'Describe what you saw.'
  else if (c.length < COMMENT_MIN) e.comment = `Please write at least ${COMMENT_MIN} characters.`
  else if (c.length > COMMENT_MAX) e.comment = `Keep your report under ${COMMENT_MAX} characters.`
  if (name.trim().length > NAME_MAX) e.reporterName = `Name must be ${NAME_MAX} characters or fewer.`
  if (photo && !PHOTO_TYPES.includes(photo.type)) e.photo = 'Photo must be a JPEG or PNG image.'
  else if (photo && photo.size > PHOTO_MAX_BYTES) e.photo = 'Photo must be 5 MB or smaller.'
  return e
}

/** Citizen report on a project. No login; the name is optional so people can report anonymously. */
export default function ReportForm({ projectId, onSent }) {
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewBroken, setPreviewBroken] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const honeypot = useRef(null)
  const fileInput = useRef(null)

  // Free the preview's object URL when it's replaced or the form unmounts.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  function clearError(k) {
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }))
  }

  function pickPhoto(file) {
    clearError('photo')
    if (!file) return
    const problem = validate({ comment: 'x'.repeat(COMMENT_MIN), name: '', photo: file }).photo
    if (problem) {
      setErrors((prev) => ({ ...prev, photo: problem }))
      if (fileInput.current) fileInput.current.value = ''
      return
    }
    setPhoto(file)
    setPreviewBroken(false)
    setPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null)
    setPreview(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = validate({ comment, name, photo })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length) return

    const form = new FormData()
    form.append('comment', comment.trim())
    if (name.trim()) form.append('reporterName', name.trim())
    if (photo) form.append('photo', photo)
    form.append('website', honeypot.current?.value ?? '')

    setSending(true)
    try {
      await submitReport(projectId, form)
      setSent(true)
      onSent?.()
      setComment('')
      setName('')
      removePhoto()
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors)
      setFormError(
        err.status === 429
          ? err.message
          : err.fieldErrors
            ? 'Please fix the highlighted fields.'
            : err.status === 404
              ? 'This project no longer exists.'
              : err.message,
      )
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck aria-hidden="true" className="h-4 w-4" /> Thank you. Your report was sent to the municipality.
        </p>
        <p className="mt-1 text-emerald-800">Staff review every report. It now appears under “Citizen reports and replies”, and the municipal reply will show there too.</p>
        <button onClick={() => setSent(false)} className="mt-3 inline-flex min-h-11 items-center font-medium text-brand-700 hover:underline">
          Send another report
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        label="What did you see?"
        required
        name="comment"
        error={errors.comment}
        hint={`${comment.trim().length}/${COMMENT_MAX} · e.g. “Work stopped two weeks ago” or “Taps installed but no water yet”.`}
      >
        {(p) => (
          <Textarea
            {...p}
            rows={4}
            maxLength={COMMENT_MAX}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              clearError('comment')
            }}
            invalid={!!errors.comment}
          />
        )}
      </Field>

      <Field label="Your name" name="reporterName" error={errors.reporterName} hint="Optional. Only the Municipal Admin sees it; it is never shown publicly.">
        {(p) => (
          <Input
            {...p}
            autoComplete="name"
            maxLength={NAME_MAX}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clearError('reporterName')
            }}
            invalid={!!errors.reporterName}
          />
        )}
      </Field>

      <div id="field-photo">
        <p className="text-sm font-medium text-slate-800">Photo</p>
        {photo && preview ? (
          <div className="mt-1.5 flex items-center gap-3">
            {previewBroken ? (
              // The browser can't display it (e.g. not really an image); the server will say why on submit.
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-line bg-slate-50 text-slate-400">
                <ImageOff aria-hidden="true" className="h-6 w-6" />
              </span>
            ) : (
              <img src={preview} alt="Selected photo preview" onError={() => setPreviewBroken(true)} className="h-20 w-20 shrink-0 rounded-lg border border-line object-cover" />
            )}
            <div className="min-w-0 text-sm">
              <p className="truncate text-slate-700">{photo.name}</p>
              <button type="button" onClick={removePhoto} className="mt-1 inline-flex min-h-11 items-center gap-1 font-medium text-accent-700 hover:underline">
                <X aria-hidden="true" className="h-4 w-4" /> Remove photo
              </button>
            </div>
          </div>
        ) : (
          <label className="mt-1.5 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:border-brand-600 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
            <Camera aria-hidden="true" className="h-4 w-4 text-slate-500" />
            <span>Add a photo (optional)</span>
            {/* JPEG/PNG only: iPhones convert HEIC to JPEG automatically for this accept list. */}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              aria-describedby="photo-hint"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </label>
        )}
        {errors.photo ? (
          <p className="mt-1 text-xs font-medium text-accent-700">{errors.photo}</p>
        ) : (
          <p id="photo-hint" className="mt-1 text-xs text-slate-500">
            JPEG or PNG, up to 5 MB. Only the Municipal Admin sees it. Location data inside the photo is removed.
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and screen readers; bots that fill every field get silently ignored. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {formError && (
        <p role="alert" className="flex gap-2 rounded-lg bg-accent-50 px-3 py-2.5 text-sm text-accent-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </p>
      )}

      <Button type="submit" icon={Send} loading={sending} className="w-full sm:w-auto">
        {sending ? 'Sending…' : 'Send report'}
      </Button>
    </form>
  )
}
