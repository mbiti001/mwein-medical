export const ORDER_STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'FULFILLED', 'CANCELLED'] as const

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending review',
  CONFIRMED: 'Confirmed',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled'
}

export type OrderItemRecord = {
  id: string
  name: string
  price: number | null
}

export function parseOrderItems(itemsJson: string): OrderItemRecord[] {
  try {
    const parsed = JSON.parse(itemsJson) as Array<{ id?: unknown; name?: unknown; price?: unknown }>
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter(item => typeof item === 'object' && item !== null)
      .map(item => {
        const typed = item as { id?: unknown; name?: unknown; price?: unknown }
        return {
          id: typeof typed.id === 'string' ? typed.id : 'unknown-item',
          name: typeof typed.name === 'string' ? typed.name : 'Unnamed item',
          price: typeof typed.price === 'number' && Number.isFinite(typed.price) ? typed.price : null
        }
      })
  } catch {
    return []
  }
}
