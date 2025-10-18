import { redirect } from 'next/navigation'

import { prisma } from '../../../lib/prisma'
import OrderStatusControl from '../../../components/OrderStatusControl'
import { ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS, parseOrderItems, type OrderStatus } from '../../../lib/orders'
import { getAuthenticatedAdmin, hasRequiredRole } from '../../../lib/authServer'
import type { AdminRole } from '../../../lib/auth'

function formatCurrency(amount: number) {
  return amount > 0 ? `KSh ${amount.toLocaleString('en-KE')}` : 'Enquiry'
}

export default async function OrdersDashboard() {
  const admin = await getAuthenticatedAdmin()

  const allowedRoles: AdminRole[] = ['ADMIN', 'PHARMACY']

  if (!admin || !hasRequiredRole(admin, allowedRoles)) {
    redirect('/dashboard')
  }

  const [orders, notifications] = await Promise.all([
    prisma.shopOrder.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: {
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    }),
    prisma.orderNotification.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 12,
      include: {
        order: {
          select: {
            reference: true,
            customerName: true
          }
        }
      }
    })
  ])

  const mappedNotifications: DashboardNotification[] = notifications.map(notification => ({
    id: notification.id,
    orderReference: notification.order.reference,
    customerName: notification.order.customerName,
    status: notification.status,
    channel: notification.channel,
    recipient: notification.recipient,
    summary: notification.summary,
    createdAt: notification.createdAt.toISOString(),
    deliveredAt: notification.deliveredAt?.toISOString() ?? null
  }))

  return (
    <div className="space-y-8">
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-slate-900 via-primary to-primary-dark text-white">
        <div className="space-y-3">
          <span className="badge bg-white/15 text-white">Pharmacy workflow</span>
          <h1 className="text-3xl font-semibold">Shop orders and fulfilment</h1>
          <p className="text-sm text-white/80">
            Review every online order submitted through the clinic shop. Update the status as you call patients, prepare prescriptions, or arrange delivery.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="card border-slate-800 bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">All orders</h2>
              <p className="text-sm text-slate-400">Status updates sync instantly across the team.</p>
            </div>
            <p className="text-xs text-slate-500">Total orders: {orders.length}</p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
              <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Alerts</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                      No orders have been captured yet.
                    </td>
                  </tr>
                )}
                {orders.map(order => {
                  const items = parseOrderItems(order.itemsJson)
                  const latestNotification = order.notifications[0]
                  return (
                    <tr key={order.id} className="align-top">
                      <td className="px-4 py-4 text-slate-300">
                        <div className="font-medium text-white">{order.reference}</div>
                        <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{order.customerName}</div>
                        <div className="text-xs text-slate-500">Phone: {order.phone}</div>
                        {order.contactChannel && <div className="text-xs text-slate-500">Preferred: {order.contactChannel}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <ul className="space-y-1 text-xs text-slate-400">
                          {items.map(item => (
                            <li key={item.id}>
                              • {item.name}{item.price ? ` — KSh ${item.price.toLocaleString('en-KE')}` : ''}
                            </li>
                          ))}
                        </ul>
                        {order.notes && (
                          <p className="mt-2 text-xs text-slate-500">Customer notes: {order.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-200 font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {latestNotification ? (
                          <div className="space-y-1 text-xs text-slate-400">
                            <p className="font-medium text-slate-200">{latestNotification.summary}</p>
                            <p>
                              <span className="mr-2 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                                {latestNotification.status}
                              </span>
                              {new Date(latestNotification.createdAt).toLocaleString('en-KE', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No alerts yet</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <OrderStatusControl
                          orderId={order.id}
                          initialStatus={(order.status as OrderStatus) ?? ORDER_STATUS_OPTIONS[0]}
                          initialNotes={order.notes}
                          handledBy={order.handledBy}
                          statusChangedAt={order.statusChangedAt?.toISOString() ?? null}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <NotificationsPanel notifications={mappedNotifications} />
      </section>
    </div>
  )
}

type DashboardNotification = {
  id: string
  orderReference: string
  customerName: string
  status: string
  channel: string
  recipient: string | null
  summary: string
  createdAt: string
  deliveredAt: string | null
}

const statusBadgeStyles: Record<string, string> = {
  SENT: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  SKIPPED: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  ERROR: 'border-rose-500/40 bg-rose-500/10 text-rose-200'
}

function getStatusClass(status: string) {
  return statusBadgeStyles[status as keyof typeof statusBadgeStyles] ?? 'border-slate-700 bg-slate-900 text-slate-300'
}

function formatTimestamp(isoString: string) {
  try {
    return new Date(isoString).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return isoString
  }
}

function NotificationsPanel({ notifications }: { notifications: DashboardNotification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="card border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-semibold text-white">Recent alerts</h3>
          <span className="text-xs uppercase tracking-wide text-slate-500">No activity yet</span>
        </div>
        <p className="py-6 text-sm text-slate-500">Notifications will appear here as new orders arrive.</p>
      </div>
    )
  }

  return (
    <div className="card border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-semibold text-white">Recent alerts</h3>
        <span className="text-xs uppercase tracking-wide text-slate-500">Last {notifications.length}</span>
      </div>
      <ul className="mt-4 space-y-4 text-sm text-slate-300">
        {notifications.map(notification => (
          <li key={notification.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium text-white">{notification.summary}</p>
                <p className="text-xs text-slate-500">
                  {notification.orderReference} • {notification.customerName}
                </p>
                {notification.recipient && (
                  <p className="text-xs text-slate-500">Recipient: {notification.recipient}</p>
                )}
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusClass(notification.status)}`}>
                {notification.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{notification.channel}</span>
              <span>{formatTimestamp(notification.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
