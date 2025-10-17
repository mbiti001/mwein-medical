"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
            <button
              className="btn-primary"
              onClick={() => {
                if (cart.length === 0) {
                  alert('Add items before submitting an order.')
                  return
                }
                alert('Checkout flow not implemented in prototype')
              }}
            >
              Confirm order
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
                <h3 className="mb-1">Order summary</h3>
                <p className="text-sm text-slate-500">Share this total with the pharmacy to receive instructions.</p>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formattedTotal}</span>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                <p>Pay via M-Pesa Till <strong>8121096</strong> or upon collection.</p>
                <p>Need delivery? Mention your location when confirming.</p>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  className="btn-primary justify-center"
                  href={`https://wa.me/254707711888?text=Hello%20Mwein%2C%20here%20is%20my%20cart:%0A${encodeURIComponent(cart.map(item => `• ${item.name} (${item.price ? `KSh ${item.price.toLocaleString('en-KE')}` : 'Enquiry'})`).join('\n'))}%0AOrder%20total:%20${encodeURIComponent(formattedTotal)}`}
                >
                  Send cart via WhatsApp
                </a>
                <button className="btn-outline justify-center" onClick={clearCart}>Clear cart</button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  )
}
