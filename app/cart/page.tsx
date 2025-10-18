"use client"

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'

type CartItem = {
  id: string
  name: string
  price?: number
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<CartItem>
  return typeof candidate.id === 'string' && typeof candidate.name === 'string'
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [contactChannel, setContactChannel] = useState('Phone call')
  const [notes, setNotes] = useState('')
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [orderReference, setOrderReference] = useState<string | null>(null)
  const orderFormRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      if (!raw) {
        return
      }
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter(isCartItem)
        setCart(sanitized)
      }
    } catch (error) {
      console.error('Failed to read cart from storage', error)
    }
  }, [])

  function clearCart() {
    localStorage.removeItem('cart')
    setCart([])
    setOrderReference(null)
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmissionError(null)

    if (cart.length === 0) {
      setSubmissionError('Add items to your cart before confirming the order.')
      return
    }

    if (!customerName.trim() || !phone.trim()) {
      setSubmissionError('Please provide the patient or guardian name and a phone number we can reach you on.')
      return
    }

    setSubmissionState('submitting')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          contactChannel: contactChannel || undefined,
          notes: notes.trim() || undefined,
          items: cart,
          totalAmount: cart.reduce<number>((sum, item) => sum + (item.price ?? 0), 0)
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string }
        if (payload?.error === 'invalid-payload') {
          setSubmissionError('Some details are missing or incorrect. Please review the form and try again.')
        } else {
          setSubmissionError('Unable to submit the order right now. Please try again or contact the pharmacy directly.')
        }
        setSubmissionState('error')
        return
      }

      const data = await response.json() as { reference?: string }
      setOrderReference(data.reference ?? null)
      setSubmissionState('success')
      setCustomerName('')
      setPhone('')
      setContactChannel('Phone call')
      setNotes('')
      localStorage.removeItem('cart')
      setCart([])
    } catch (error) {
      console.error('Failed to submit order', error)
      setSubmissionError('Unexpected error. Please try again in a moment.')
      setSubmissionState('error')
    }
  }

  function scrollToOrderForm() {
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const total = cart.reduce<number>((sum, item) => sum + (item.price ?? 0), 0)
  const formattedTotal = total > 0 ? `KSh ${total.toLocaleString('en-KE')}` : 'KSh 0'

  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-white via-slate-50 to-sky-50 shadow-inset mb-10">
        <div className="max-w-3xl">
          <span className="badge mb-4">Your Cart</span>
          <h1>Ready to confirm your clinic order</h1>
          <p className="text-slate-600">
            Review the items below, then share your cart reference with our pharmacy team. Payment happens securely via M-Pesa Till <strong>8121096</strong> at pick-up or before delivery.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-outline">Continue shopping</Link>
            <button type="button" className="btn-primary" onClick={scrollToOrderForm}>
              Confirm order online
            </button>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        {cart.length === 0 ? (
          <div className="card text-center">
            <h3 className="mb-2">Your cart is empty</h3>
            <p className="text-sm text-slate-600 mb-4">Browse the clinic shop to add over-the-counter items and monitoring devices.</p>
            <Link href="/shop" className="btn-primary justify-center">Explore products</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-start">
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="card flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-semibold mb-1">{item.name}</h4>
                    <p className="text-sm text-slate-500">OTC clinic item</p>
                  </div>
                  <div className="text-base font-semibold text-primary">
                    {item.price ? `KSh ${item.price.toLocaleString('en-KE')}` : 'Included'}
                  </div>
                </div>
              ))}
            </div>
            <aside className="card space-y-4 sticky top-24">
              <div>
                <h3 className="mb-1">Confirm your order</h3>
                <p className="text-sm text-slate-500">Share your details so the pharmacy team can reserve stock and contact you with next steps.</p>
              </div>
              <form ref={orderFormRef} onSubmit={submitOrder} className="space-y-4">
                <div className="grid gap-4">
                  <div className="form-field">
                    <label className="form-label" htmlFor="order-name">Patient or guardian name</label>
                    <input id="order-name" className="form-input" value={customerName} onChange={event => setCustomerName(event.target.value)} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="order-phone">Phone number</label>
                    <input id="order-phone" className="form-input" value={phone} onChange={event => setPhone(event.target.value)} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="order-channel">Preferred follow-up</label>
                    <select id="order-channel" className="form-select" value={contactChannel} onChange={event => setContactChannel(event.target.value)}>
                      <option>Phone call</option>
                      <option>WhatsApp</option>
                      <option>SMS</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="order-notes">Notes (optional)</label>
                    <textarea id="order-notes" className="form-textarea" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Include delivery location, prescription notes, or urgent needs." />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <span>Total due</span>
                  <span className="text-base font-semibold text-slate-900">{formattedTotal}</span>
                </div>

                {submissionError && <p className="form-error">{submissionError}</p>}
                {submissionState === 'success' && orderReference && (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Order received! Share reference <strong>{orderReference}</strong> when calling or messaging the pharmacy.
                  </p>
                )}

                <button type="submit" className="btn-primary w-full justify-center" disabled={submissionState === 'submitting'}>
                  {submissionState === 'submitting' ? 'Submitting…' : 'Send order to pharmacy'}
                </button>
              </form>
              <div className="space-y-2 text-sm text-slate-500">
                <p>Prefer messaging? Forward your cart via WhatsApp for quick confirmation.</p>
                <a
                  className="btn-outline justify-center"
                  href={`https://wa.me/254707711888?text=Hello%20Mwein%2C%20here%20is%20my%20cart:%0A${encodeURIComponent(cart.map(item => `• ${item.name} (${item.price ? `KSh ${item.price.toLocaleString('en-KE')}` : 'Enquiry'})`).join('\n'))}%0AOrder%20total:%20${encodeURIComponent(formattedTotal)}`}
                >
                  Send cart via WhatsApp
                </a>
                <button type="button" className="btn-outline justify-center" onClick={clearCart}>Clear cart</button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  )
}
