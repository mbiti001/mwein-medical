import { redirect } from 'next/navigation'

import { prisma } from '../../../lib/prisma'
import { getAuthenticatedAdmin, hasRequiredRole } from '../../../lib/authServer'
import type { AdminRole } from '../../../lib/auth'
import AppointmentsTable from '../components/AppointmentsTable'
import { APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_STATUS_LABELS } from '../../../lib/appointments'

async function getAppointmentData() {
  const appointments = await prisma.appointmentRequest.findMany({
    orderBy: [{ createdAt: 'desc' }]
  })

  const statusCounts = appointments.reduce<Record<string, number>>((acc, appointment) => {
    const status = appointment.status ?? 'NEW'
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})

  return {
    appointments,
    statusCounts
  }
}

export default async function AppointmentsDashboard() {
  const admin = await getAuthenticatedAdmin()
  const allowedRoles: AdminRole[] = ['ADMIN', 'CLINIC']

  if (!admin || !hasRequiredRole(admin, allowedRoles)) {
    redirect('/dashboard')
  }

  const { appointments, statusCounts } = await getAppointmentData()

  return (
    <div className="space-y-8">
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-slate-900 via-primary to-primary-dark text-white">
        <div className="space-y-3">
          <span className="badge bg-white/15 text-white">Clinical coordination</span>
          <h1 className="text-3xl font-semibold">Appointment requests</h1>
          <p className="text-sm text-white/80">
            Review bookings submitted via the public site, capture notes, and track follow-up progress without relying on WhatsApp threads.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {APPOINTMENT_STATUS_OPTIONS.map(status => (
            <div key={status} className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">{APPOINTMENT_STATUS_LABELS[status]}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{statusCounts[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card border-slate-800 bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">All requests</h2>
            <p className="text-sm text-slate-400">Latest submissions appear first. Update status as the team contacts clients.</p>
          </div>
          <p className="text-xs text-slate-500">Total: {appointments.length}</p>
        </div>
        <div className="mt-6">
          <AppointmentsTable appointments={appointments} />
        </div>
      </section>
    </div>
  )
}
