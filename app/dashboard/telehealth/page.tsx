import { buildPageMetadata } from '../../../lib/metadata'
import { prisma } from '../../../lib/prisma'

export const metadata = buildPageMetadata({
  title: 'Telehealth consultation log',
  description: 'Dashboard summarising telehealth consultations with age, gender, and date tallies.',
  path: '/dashboard/telehealth'
})

export const revalidate = 60

const genderLabels: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  non_binary: 'Non-binary',
  prefer_not_to_say: 'Prefer not to say'
}

function formatGender(value: string | null | undefined) {
  if (!value) return 'Unknown'
  return genderLabels[value] ?? value.replace(/_/g, ' ')
}

function formatDate(value: Date | null | undefined, fallback?: string | null) {
  if (value) {
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(value)
  }

  if (fallback) {
    try {
      const candidate = new Date(fallback)
      if (!Number.isNaN(candidate.getTime())) {
        return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(candidate)
      }
    } catch {
      // ignore parse failure and use raw string below
    }
    return fallback
  }

  return 'TBC'
}

async function getTelehealthAppointments() {
  const records = await prisma.appointmentRequest.findMany({
    where: { consultationType: 'TELEHEALTH' },
    orderBy: [{ consultationDate: 'desc' }, { createdAt: 'desc' }],
    take: 100
  })

  const withDerived = records.map(record => {
    const safeAge = typeof record.patientAge === 'number' && Number.isFinite(record.patientAge) ? record.patientAge : null
    return {
      ...record,
      patientAge: safeAge
    }
  })

  const total = withDerived.length
  const ageValues = withDerived
    .map(record => record.patientAge)
    .filter((value): value is number => typeof value === 'number')

  const averageAge = ageValues.length > 0 ? ageValues.reduce((sum, value) => sum + value, 0) / ageValues.length : null

  const genderBreakdown = withDerived.reduce<Record<string, number>>((acc, record) => {
    const key = record.patientGender ?? 'unknown'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return {
    total,
    averageAge,
    genderBreakdown,
    records: withDerived
  }
}

export default async function TelehealthDashboard() {
  const { total, averageAge, genderBreakdown, records } = await getTelehealthAppointments()

  const genderEntries = Object.entries(genderBreakdown)

  return (
    <div className="space-y-10">
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-slate-900 via-primary to-primary-dark text-white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="badge bg-white/15 text-white">Internal dashboard</span>
            <h1 className="text-4xl font-semibold">Telehealth consultation summary</h1>
            <p className="max-w-2xl text-sm text-white/80">
              Snapshot of the latest 100 telehealth appointments logged via the booking form. Use this feed to track demand, demographics, and follow-up needs.
            </p>
          </div>
          <div className="card border-white/20 bg-white/10 text-white">
            <p className="text-xs uppercase tracking-wider text-white/70">Total telehealth consults captured</p>
            <p className="text-4xl font-semibold">{total}</p>
            <p className="text-xs text-white/70">Data refreshes every minute</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card border-slate-200">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Average age</h2>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{averageAge ? averageAge.toFixed(1) : '—'}</p>
          <p className="text-xs text-slate-500">Calculated from submissions that included age.</p>
        </div>
        <div className="card border-slate-200 md:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Gender distribution</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {genderEntries.length === 0 && <p className="text-sm text-slate-500">No telehealth submissions yet.</p>}
            {genderEntries.map(([key, count]) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{formatGender(key)}</p>
                <p className="text-2xl font-semibold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Consultation log</h2>
            <p className="text-sm text-slate-500">Chronological list of telehealth submissions with age, gender, and planned date/time.</p>
          </div>
          <p className="text-xs text-slate-400">Showing latest {records.length} submissions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Consultation date</th>
                <th className="px-4 py-3">Preferred time</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>No telehealth consultations recorded yet.</td>
                </tr>
              )}
              {records.map(record => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{record.name}</td>
                  <td className="px-4 py-3 text-slate-700">{record.patientAge ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{formatGender(record.patientGender)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(record.consultationDate, record.preferredDate)}</td>
                  <td className="px-4 py-3 text-slate-700">{record.preferredTime}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="line-clamp-2">{record.reason}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
