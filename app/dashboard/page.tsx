import Link from 'next/link'

import { prisma } from '../../lib/prisma'
import { ORDER_STATUS_LABELS, parseOrderItems } from '../../lib/orders'

async function getRecentOrderSummary() {
  const [totalOrders, pendingCount, latestOrder] = await Promise.all([
    prisma.shopOrder.count(),
    prisma.shopOrder.count({ where: { status: 'PENDING' } }),
    prisma.shopOrder.findFirst({
      orderBy: [{ createdAt: 'desc' }]
    })
  ])

  return {
    totalOrders,
    pendingCount,
    latestOrder: latestOrder
      ? {
        reference: latestOrder.reference,
        customerName: latestOrder.customerName,
        totalAmount: latestOrder.totalAmount,
        status: latestOrder.status,
        createdAt: latestOrder.createdAt.toISOString()
      }
      : null
  }
}

async function getTelehealthSnapshot() {
  const [totalTelehealth, upcomingTelehealth] = await Promise.all([
    prisma.appointmentRequest.count({ where: { consultationType: 'TELEHEALTH' } }),
    prisma.appointmentRequest.count({
      where: {
        consultationType: 'TELEHEALTH',
        consultationDate: {
          gte: new Date(Date.now() - 1000 * 60 * 60)
        }
      }
    })
  ])

  return {
    totalTelehealth,
    upcomingTelehealth
  }
}

export default async function DashboardHome() {
  const [orders, telehealth] = await Promise.all([getRecentOrderSummary(), getTelehealthSnapshot()])

  return (
    <div className="space-y-10">
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-slate-900 text-white">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <span className="badge bg-white/15 text-white">Admin overview</span>
            <h1 className="text-3xl font-semibold">Clinic operations at a glance</h1>
            <p className="text-sm text-white/80">
              Quick snapshot of pharmacy orders and telehealth activity captured via the website. Dive into the modules below for more detail or to update statuses.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/orders" className="btn-primary bg-white text-slate-900 hover:bg-slate-100">Review orders</Link>
              <Link href="/dashboard/telehealth" className="btn-outline border-white text-white hover:bg-white/10">Telehealth log</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card border-white/20 bg-white/10 text-white">
              <p className="text-xs uppercase tracking-wider text-white/70">Orders captured</p>
              <p className="text-4xl font-semibold">{orders.totalOrders}</p>
              <p className="text-xs text-white/70">{orders.pendingCount} awaiting follow-up</p>
            </div>
            <div className="card border-white/20 bg-white/10 text-white">
              <p className="text-xs uppercase tracking-wider text-white/70">Telehealth consults</p>
              <p className="text-4xl font-semibold">{telehealth.totalTelehealth}</p>
              <p className="text-xs text-white/70">{telehealth.upcomingTelehealth} upcoming in next hour</p>
            </div>
            {orders.latestOrder && (
              <div className="sm:col-span-2 card border-white/20 bg-white/10 text-white">
                <p className="text-xs uppercase tracking-wider text-white/70">Latest order</p>
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">{orders.latestOrder.customerName}</p>
                  <p className="text-sm text-white/70">Reference {orders.latestOrder.reference}</p>
                  <p className="text-sm text-white/70">Status {ORDER_STATUS_LABELS[orders.latestOrder.status as keyof typeof ORDER_STATUS_LABELS]}</p>
                  <p className="text-sm text-white/70">Captured {new Date(orders.latestOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card border-slate-800 bg-slate-950">
          <h2 className="text-lg font-semibold text-white">Recent pharmacy orders</h2>
          <p className="text-sm text-slate-400 mb-4">Latest four submissions to help prioritise follow-up.</p>
          <OrdersPreview />
        </div>
        <div className="card border-slate-800 bg-slate-950">
          <h2 className="text-lg font-semibold text-white">Telehealth quick view</h2>
          <p className="text-sm text-slate-400 mb-4">Recent submissions including planned consultation times.</p>
          <TelehealthPreview />
        </div>
      </section>
    </div>
  )
}

async function OrdersPreview() {
  const orders = await prisma.shopOrder.findMany({
    orderBy: [{ createdAt: 'desc' }],
    take: 4
  })

  if (orders.length === 0) {
    return <p className="text-sm text-slate-400">No orders captured yet.</p>
  }

  return (
    <ul className="space-y-4">
      {orders.map(order => {
        const items = parseOrderItems(order.itemsJson)
        const totalLabel = order.totalAmount > 0 ? `KSh ${order.totalAmount.toLocaleString('en-KE')}` : 'Enquiry'
        return (
          <li key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{order.customerName}</p>
                <p className="text-xs text-slate-400">{order.reference}</p>
              </div>
              <span className="rounded-full border border-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Total: {totalLabel}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              {items.map(item => (
                <li key={item.id}>• {item.name}{item.price ? ` — KSh ${item.price.toLocaleString('en-KE')}` : ''}</li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

async function TelehealthPreview() {
  const consultations = await prisma.appointmentRequest.findMany({
    where: { consultationType: 'TELEHEALTH' },
    orderBy: [{ createdAt: 'desc' }],
    take: 5
  })

  if (consultations.length === 0) {
    return <p className="text-sm text-slate-400">No telehealth submissions yet.</p>
  }

  return (
    <ul className="space-y-3 text-sm text-slate-400">
      {consultations.map(consultation => (
        <li key={consultation.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-white">{consultation.name}</p>
            <span className="text-xs uppercase tracking-wide text-slate-500">{consultation.patientGender ?? 'Unknown'}</span>
          </div>
          <p className="text-xs text-slate-500">Preferred time {consultation.preferredDate} {consultation.preferredTime}</p>
          <p className="text-xs text-slate-500">{consultation.reason}</p>
        </li>
      ))}
    </ul>
  )
}
