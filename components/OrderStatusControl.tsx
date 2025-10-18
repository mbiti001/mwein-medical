"use client"

import { useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'

import { ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS, type OrderStatus } from '../lib/orders'

type Props = {
  orderId: string
  initialStatus: OrderStatus
  initialNotes?: string | null
  handledBy?: string | null
  statusChangedAt?: string | null
}

export default function OrderStatusControl({ orderId, initialStatus, initialNotes, handledBy, statusChangedAt }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(initialStatus)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, status, notes: notes.trim() || undefined })
      })

      if (!response.ok) {
        setError('Could not update status. Please try again.')
        return
      }

      const payload = await response.json() as { order?: { status?: OrderStatus; notes?: string | null } }
      if (payload.order?.status) {
        setStatus(payload.order.status)
      }
      if (payload.order?.notes !== undefined) {
        setNotes(payload.order.notes ?? '')
      }

      setMessage('Order updated.')
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error('Failed to update order status', err)
      setError('Unexpected error while updating order.')
    }
  }

  const disabled = isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="form-select"
          value={status}
          onChange={event => setStatus(event.target.value as OrderStatus)}
          disabled={disabled}
        >
          {ORDER_STATUS_OPTIONS.map(option => (
            <option key={option} value={option}>{ORDER_STATUS_LABELS[option]}</option>
          ))}
        </select>
        <button type="submit" className="btn-outline" disabled={disabled}>
          Save
        </button>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor={`order-notes-${orderId}`}>Staff notes</label>
        <textarea
          id={`order-notes-${orderId}`}
          className="form-textarea"
          placeholder="Internal notes for the pickup or delivery team."
          value={notes}
          onChange={event => setNotes(event.target.value)}
          disabled={disabled}
        />
      </div>
      {(handledBy || statusChangedAt) && (
        <p className="text-xs text-slate-500">
          Last updated {statusChangedAt ? new Date(statusChangedAt).toLocaleString() : 'recently'}{handledBy ? ` by ${handledBy}` : ''}.
        </p>
      )}
      {message && <p className="text-xs text-emerald-600">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
