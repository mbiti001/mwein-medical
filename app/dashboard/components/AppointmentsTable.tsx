import { Prisma } from '@prisma/client'
import AppointmentStatusControl from '../../../components/AppointmentStatusControl'
import { getConsultationLabel, APPOINTMENT_STATUS_LABELS, type AppointmentStatus, isValidAppointmentStatus } from '../../../lib/appointments'

export type AppointmentWithOptionalDate = Prisma.AppointmentRequestGetPayload<{
  select: {
    id: true
    name: true
    phone: true
    email: true
    preferredDate: true
    preferredTime: true
    reason: true
    patientAge: true
    patientGender: true
    consultationType: true
    consultationDate: true
    status: true
    notes: true
    createdAt: true
    updatedAt: true
  }
}>

function formatPreferredSlot(record: AppointmentWithOptionalDate) {
  const { consultationDate, preferredDate, preferredTime } = record

  if (consultationDate) {
    try {
      return new Intl.DateTimeFormat('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(consultationDate)
    } catch {
      // fall through to string fallback
    }
  }

  const dateLabel = preferredDate?.trim() || 'TBC'
  const timeLabel = preferredTime?.trim() || '—'
  return `${dateLabel} • ${timeLabel}`
}

function formatAge(age: number | null) {
  if (typeof age !== 'number' || Number.isNaN(age)) {
    return '—'
  }
  return `${age}`
}

function formatGender(value: string | null) {
  if (!value) return 'Unknown'
  const capitalised = value.replace(/_/g, ' ')
  return capitalised.charAt(0).toUpperCase() + capitalised.slice(1)
}

export default function AppointmentsTable({ appointments }: { appointments: AppointmentWithOptionalDate[] }) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
        No appointment requests captured yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
        <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Consultation</th>
            <th className="px-4 py-3">Preferred slot</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">Requested</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {appointments.map(appointment => (
            <tr key={appointment.id} className="align-top">
              <td className="px-4 py-3">
                <div className="font-semibold text-white">{appointment.name}</div>
                <div className="text-xs text-slate-500">{appointment.phone}</div>
                {appointment.email && (
                  <div className="text-xs text-slate-500">{appointment.email}</div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-700 px-2 py-0.5">Age {formatAge(appointment.patientAge)}</span>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5">{formatGender(appointment.patientGender)}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {getConsultationLabel(appointment.consultationType)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-200">
                <p>{formatPreferredSlot(appointment)}</p>
                <p className="mt-2 text-xs text-slate-500">Preferred time {appointment.preferredTime || '—'}</p>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                  {(() => {
                    const statusKey: AppointmentStatus = isValidAppointmentStatus(appointment.status) ? appointment.status : 'NEW'
                    return APPOINTMENT_STATUS_LABELS[statusKey]
                  })()}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                <p className="whitespace-pre-line">{appointment.reason}</p>
                {appointment.notes && (
                  <p className="mt-2 text-xs text-amber-300">{appointment.notes}</p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                <p>{new Date(appointment.createdAt).toLocaleString('en-KE', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}</p>
                <p className="mt-1 text-slate-600">Updated {new Date(appointment.updatedAt).toLocaleString('en-KE', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}</p>
              </td>
              <td className="px-4 py-3">
                <AppointmentStatusControl
                  appointmentId={appointment.id}
                  initialStatus={isValidAppointmentStatus(appointment.status) ? appointment.status : 'NEW'}
                  initialNotes={appointment.notes}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
