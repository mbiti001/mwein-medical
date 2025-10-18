import { NextResponse } from 'next/server'

import { getAuthenticatedAdmin, hasRequiredRole } from '../../../../lib/authServer'
import type { AdminRole } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

const allowedRoles: AdminRole[] = ['ADMIN', 'PHARMACY']

export async function GET() {
  const admin = await getAuthenticatedAdmin()

  if (!admin || !hasRequiredRole(admin, allowedRoles)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const notifications = await prisma.orderNotification.findMany({
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

  return NextResponse.json({
    notifications: notifications.map(notification => ({
      id: notification.id,
      orderReference: notification.order.reference,
      customerName: notification.order.customerName,
      channel: notification.channel,
      status: notification.status,
      recipient: notification.recipient,
      summary: notification.summary,
      createdAt: notification.createdAt.toISOString(),
      deliveredAt: notification.deliveredAt?.toISOString() ?? null
    }))
  })
}
