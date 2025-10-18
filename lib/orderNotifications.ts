import { sendEmail } from './email'
import { prisma } from './prisma'
import type { OrderItemRecord } from './orders'

export type OrderNotificationInput = {
  orderId: string
  reference: string
  customerName: string
  phone: string
  contactChannel?: string | null
  totalAmount: number
  notes?: string | null
  submittedAt: Date
}

function formatCurrency(amount: number) {
  if (amount <= 0) {
    return 'Enquiry'
  }

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0
  }).format(amount)
}

function createHtmlBody(order: OrderNotificationInput, items: OrderItemRecord[]) {
  const itemsList = items
    .map(item => `<li><strong>${item.name}</strong>${item.price ? ` — ${formatCurrency(item.price)}` : ''}</li>`)
    .join('')

  const notesBlock = order.notes ? `<p><strong>Customer notes:</strong><br/>${order.notes.replace(/\n/g, '<br/>')}</p>` : ''

  return `
    <h2>New shop order received</h2>
    <p>A customer submitted a new order via the online shop.</p>
    <ul>
      <li><strong>Reference:</strong> ${order.reference}</li>
      <li><strong>Customer:</strong> ${order.customerName}</li>
      <li><strong>Phone:</strong> ${order.phone}</li>
      ${order.contactChannel ? `<li><strong>Preferred contact:</strong> ${order.contactChannel}</li>` : ''}
      <li><strong>Total:</strong> ${formatCurrency(order.totalAmount)}</li>
      <li><strong>Submitted:</strong> ${order.submittedAt.toLocaleString('en-KE')}</li>
    </ul>
    <p><strong>Items</strong></p>
    <ul>${itemsList}</ul>
    ${notesBlock}
  `
}

function createTextBody(order: OrderNotificationInput, items: OrderItemRecord[]) {
  const itemsList = items
    .map(item => `• ${item.name}${item.price ? ` — ${formatCurrency(item.price)}` : ''}`)
    .join('\n')

  const lines = [
    'New shop order received',
    `Reference: ${order.reference}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
  ]

  if (order.contactChannel) {
    lines.push(`Preferred contact: ${order.contactChannel}`)
  }

  lines.push(`Total: ${formatCurrency(order.totalAmount)}`)
  lines.push(`Submitted: ${order.submittedAt.toLocaleString('en-KE')}`)
  lines.push('', 'Items:', itemsList || 'None provided')

  if (order.notes) {
    lines.push('', 'Customer notes:', order.notes)
  }

  return lines.join('\n')
}

function buildSummary(result: Awaited<ReturnType<typeof sendEmail>>): string {
  if (result.status === 'sent') {
    return `Email sent to ${result.recipient}`
  }

  if (result.reason === 'missing-config') {
    return 'Notification skipped: SMTP is not configured'
  }

  return 'Notification skipped: No recipient available'
}

export async function notifyOrderSubmission(order: OrderNotificationInput, items: OrderItemRecord[]) {
  const html = createHtmlBody(order, items)
  const text = createTextBody(order, items)

  try {
    const emailResult = await sendEmail({
      subject: `New shop order: ${order.reference}`,
      html,
      text
    })

    const status = emailResult.status === 'sent' ? 'SENT' : 'SKIPPED'
    const deliveredAt = emailResult.status === 'sent' ? new Date() : null
    const metadata = emailResult.status === 'sent'
      ? { messageId: emailResult.messageId }
      : { reason: emailResult.reason }

    const record = await prisma.orderNotification.create({
      data: {
        orderId: order.orderId,
        channel: 'EMAIL',
        status,
        recipient: emailResult.status === 'sent' ? emailResult.recipient : null,
        summary: buildSummary(emailResult),
        metadataJson: JSON.stringify(metadata),
        deliveredAt
      }
    })

    return { emailResult, record }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown notification error'

    await prisma.orderNotification.create({
      data: {
        orderId: order.orderId,
        channel: 'EMAIL',
        status: 'ERROR',
        summary: `Notification failed: ${message}`,
        metadataJson: JSON.stringify({ error: message }),
        deliveredAt: null
      }
    }).catch(loggingError => {
      console.error('Failed to persist notification error log', loggingError)
    })

    throw error
  }
}

export type NotifyOrderSubmissionResult = Awaited<ReturnType<typeof notifyOrderSubmission>>

export async function sendOrderSubmissionNotification(order: OrderNotificationInput, items: OrderItemRecord[]) {
  return notifyOrderSubmission(order, items)
}

export function createOrderItemsFromPayload(items: Array<{ id: string; name: string; price?: number | null }>): OrderItemRecord[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : null
  }))
}

export function buildNotificationInputFromOrder(order: {
  id: string
  reference: string
  customerName: string
  phone: string
  contactChannel: string | null
  totalAmount: number
  notes: string | null
  createdAt: Date
}): OrderNotificationInput {
  return {
    orderId: order.id,
    reference: order.reference,
    customerName: order.customerName,
    phone: order.phone,
    contactChannel: order.contactChannel,
    totalAmount: order.totalAmount,
    notes: order.notes,
    submittedAt: order.createdAt
  }
}
