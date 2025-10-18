import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendEmailMock, createNotificationMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  createNotificationMock: vi.fn()
}))

vi.mock('../email', () => ({
  sendEmail: sendEmailMock
}))

vi.mock('../prisma', () => ({
  prisma: {
    orderNotification: {
      create: createNotificationMock
    }
  }
}))

import { notifyOrderSubmission, buildNotificationInputFromOrder, createOrderItemsFromPayload } from '../orderNotifications'

describe('orderNotifications', () => {
  const baseOrder = {
    id: 'order-1',
    reference: 'ORD-123ABC',
    customerName: 'Jane Doe',
    phone: '+254700000000',
    contactChannel: 'WhatsApp',
    totalAmount: 4500,
    notes: 'Deliver to reception',
    createdAt: new Date('2025-10-18T08:30:00Z')
  }

  const payloadItems = [
    { id: 'medicine-1', name: 'Antibiotics', price: 2500 },
    { id: 'medicine-2', name: 'Pain relief', price: 2000 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends email and persists notification when delivery succeeds', async () => {
    sendEmailMock.mockResolvedValue({ status: 'sent', messageId: 'abc123', recipient: 'alerts@example.com' })
    createNotificationMock.mockResolvedValue({ id: 'notif-1' })

    const input = buildNotificationInputFromOrder(baseOrder)
    const items = createOrderItemsFromPayload(payloadItems)

    const result = await notifyOrderSubmission(input, items)

    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(createNotificationMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        channel: 'EMAIL',
        status: 'SENT',
        recipient: 'alerts@example.com'
      })
    })
    expect(result.emailResult).toEqual({ status: 'sent', messageId: 'abc123', recipient: 'alerts@example.com' })
    expect(result.record).toEqual({ id: 'notif-1' })
  })

  it('records skipped notifications when SMTP is missing', async () => {
    sendEmailMock.mockResolvedValue({ status: 'skipped', reason: 'missing-config' })
    createNotificationMock.mockResolvedValue({ id: 'notif-2' })

    const input = buildNotificationInputFromOrder(baseOrder)
    const items = createOrderItemsFromPayload(payloadItems)

    const result = await notifyOrderSubmission(input, items)

    expect(sendEmailMock).toHaveBeenCalled()
    expect(createNotificationMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        status: 'SKIPPED'
      })
    })
    expect(result.emailResult).toEqual({ status: 'skipped', reason: 'missing-config' })
  })

  it('logs and rethrows when email delivery fails', async () => {
    const error = new Error('SMTP failure')
    sendEmailMock.mockRejectedValue(error)
    createNotificationMock.mockResolvedValue({ id: 'notif-error' })

    const input = buildNotificationInputFromOrder(baseOrder)
    const items = createOrderItemsFromPayload(payloadItems)

    await expect(notifyOrderSubmission(input, items)).rejects.toThrow('SMTP failure')
    expect(createNotificationMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        status: 'ERROR'
      })
    })
  })

  it('normalises item prices when building payload items', () => {
    const items = createOrderItemsFromPayload([
      { id: '1', name: 'Test A', price: 1200 },
      { id: '2', name: 'Test B', price: null },
      { id: '3', name: 'Test C' }
    ])

    expect(items).toEqual([
      { id: '1', name: 'Test A', price: 1200 },
      { id: '2', name: 'Test B', price: null },
      { id: '3', name: 'Test C', price: null }
    ])
  })
})
