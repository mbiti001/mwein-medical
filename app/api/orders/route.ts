import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'

import { prisma } from '../../../lib/prisma'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/auth'
import { ORDER_STATUS_OPTIONS, parseOrderItems } from '../../../lib/orders'
import { buildNotificationInputFromOrder, createOrderItemsFromPayload, notifyOrderSubmission } from '../../../lib/orderNotifications'

const orderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  price: z.number().int().min(0).nullable().optional()
})

const orderSchema = z.object({
  customerName: z.string().min(1).max(120),
  phone: z.string().min(5).max(32),
  contactChannel: z.string().min(1).max(40).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number().int().min(0)
})

const patchSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUS_OPTIONS),
  notes: z.string().max(1000).optional()
})

function generateReference() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ORD-${random}`
}

function serializeItems(items: Array<{ id: string; name: string; price?: number | null | undefined }>) {
  return JSON.stringify(items.map(item => ({
    id: item.id,
    name: item.name,
    price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : null
  })))
}

export async function POST(request: Request) {
  try {
    const payload = orderSchema.parse(await request.json())

    const computedTotal = payload.items.reduce((sum, item) => sum + (item.price ?? 0), 0)
    const totalAmount = computedTotal !== payload.totalAmount ? computedTotal : payload.totalAmount

    const reference = generateReference()

    const order = await prisma.shopOrder.create({
      data: {
        reference,
        customerName: payload.customerName.trim(),
        phone: payload.phone.trim(),
        contactChannel: payload.contactChannel?.trim() ?? null,
        itemsJson: serializeItems(payload.items),
        totalAmount,
        notes: payload.notes?.trim() || null,
        statusChangedAt: new Date()
      }
    })

    const notificationItems = createOrderItemsFromPayload(payload.items)
    const notificationInput = buildNotificationInputFromOrder(order)

    void (async () => {
      try {
        const result = await notifyOrderSubmission(notificationInput, notificationItems)
        if (result.emailResult.status === 'skipped') {
          console.log('Order notification skipped', { reference: order.reference, reason: result.emailResult.reason })
        }
      } catch (error) {
        console.error('Failed to process order notification', error)
      }
    })()

    return NextResponse.json({ ok: true, reference: order.reference })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
    }
    console.error('Failed to submit shop order', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}

export async function GET() {
  const session = verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const orders = await prisma.shopOrder.findMany({
    orderBy: [{ createdAt: 'desc' }]
  })

  return NextResponse.json({
    orders: orders.map(order => ({
      id: order.id,
      reference: order.reference,
      customerName: order.customerName,
      phone: order.phone,
      contactChannel: order.contactChannel,
      notes: order.notes,
      status: order.status,
      totalAmount: order.totalAmount,
      handledBy: order.handledBy,
      statusChangedAt: order.statusChangedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: parseOrderItems(order.itemsJson)
    }))
  })
}

export async function PATCH(request: Request) {
  const session = verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  try {
    const payload = patchSchema.parse(await request.json())

    const updated = await prisma.shopOrder.update({
      where: { id: payload.orderId },
      data: {
        status: payload.status,
        notes: payload.notes?.trim() ?? undefined,
        handledBy: session.email,
        statusChangedAt: new Date()
      }
    })

    return NextResponse.json({
      ok: true,
      order: {
        id: updated.id,
        status: updated.status,
        notes: updated.notes,
        handledBy: updated.handledBy,
        statusChangedAt: updated.statusChangedAt?.toISOString() ?? null
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
    }

    console.error('Failed to update order', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
