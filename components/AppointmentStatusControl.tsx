"use client"

import { useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'

import { APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from '../lib/appointments'

type Props = {
  appointmentId: string
  initialStatus: AppointmentStatus
  initialNotes?: string | null
}

export default function AppointmentStatusControl({ appointmentId, initialStatus, initialNotes }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<AppointmentStatus>(initialStatus)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          status,
          notes: notes.trim() || undefined
        })
      })

      if (!response.ok) {
        setError('Update failed. Please try again.')
        return
      }

      const payload = await response.json() as { appointment?: { status?: AppointmentStatus; notes?: string | null } }
      if (payload.appointment?.status) {
        setStatus(payload.appointment.status)
      }
      if (payload.appointment?.notes !== undefined) {
        setNotes(payload.appointment.notes ?? '')
      }

      setMessage('Saved')
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error('Appointment status update failed', err)
      setError('Unexpected error occurred.')
    }
  }

  const disabled = isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="form-select"
          value={status}
          onChange={event => setStatus(event.target.value as AppointmentStatus)}
          disabled={disabled}
        >
          {APPOINTMENT_STATUS_OPTIONS.map(option => (
            <option key={option} value={option}>{APPOINTMENT_STATUS_LABELS[option]}</option>
          ))}
        </select>
        <button type="submit" className="btn-outline" disabled={disabled}>
          Save
        </button>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor={`appointment-notes-${appointmentId}`}>Follow-up notes</label>
        <textarea
          id={`appointment-notes-${appointmentId}`}
          className="form-textarea"
          placeholder="Internal notes for the care team"
          value={notes}
          onChange={event => setNotes(event.target.value)}
          disabled={disabled}
        />
      </div>
      {message && <p className="text-xs text-emerald-500">{message}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  )
}
