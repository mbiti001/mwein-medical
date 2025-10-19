import { requireAdmin } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

async function getAppointments() {
  return prisma.appointmentRequest.findMany({ take: 20, orderBy: { createdAt: 'desc' } })
}

async function getPayments() {
  return prisma.payment.findMany({ take: 20, orderBy: { createdAt: 'desc' } })
}

async function getDonations() {
  return prisma.donation.findMany({ take: 20, orderBy: { createdAt: 'desc' } })
}

export default async function Dashboard() {
  await requireAdmin()
  const [appointments, payments, donations] = await Promise.all([
    getAppointments(),
    getPayments(),
    getDonations()
  ])

  return (
    <div className="p-8">
      <h1>Admin Dashboard</h1>
      <section>
        <h2>Recent Appointments</h2>
        <ul>{appointments.map((a: any) => <li key={a.id}>{a.name} - {a.reason}</li>)}</ul>
      </section>
      <section>
        <h2>Recent Payments</h2>
        <ul>{payments.map((p: any) => <li key={p.id}>{p.phoneE164} - {p.amountCents / 100} KES - {p.status}</li>)}</ul>
      </section>
      <section>
        <h2>Recent Donations</h2>
        <ul>{donations.map((d: any) => <li key={d.id}>{d.name} - {d.amountCents / 100} KES</li>)}</ul>
      </section>
    </div>
  )
}