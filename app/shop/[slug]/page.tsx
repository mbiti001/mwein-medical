"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { products } from '../../../data/products'

type CartItem = {
  id: string
  name: string
  price?: number
}

function isCartItem(input: unknown): input is CartItem {
  if (typeof input !== 'object' || input === null) {
    return false
  }
  const candidate = input as Partial<CartItem>
  return typeof candidate.id === 'string' && typeof candidate.name === 'string'
}

const formatPrice = (value?: number) => (typeof value === 'number' ? `KSh ${value.toLocaleString('en-KE')}` : 'Price on request')

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find(p => p.slug === params.slug)
  const [isAdded, setIsAdded] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!product) {
      setIsAdded(false)
      return
    }
    try {
      const raw = localStorage.getItem('cart')
      if (!raw) {
        setIsAdded(false)
        return
      }
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const cartItems = parsed.filter(isCartItem)
        setIsAdded(cartItems.some(item => item.id === product.id))
      }
    } catch (cartError) {
      console.error('Failed to read cart from storage', cartError)
      setIsAdded(false)
    }
  }, [product])

  const handleAddToCart = () => {
    if (!product) return
    setIsUpdating(true)
    setError(null)

    try {
      const raw = localStorage.getItem('cart')
      const parsed: unknown = raw ? JSON.parse(raw) : []
      const cart = Array.isArray(parsed) ? parsed.filter(isCartItem) : []

      if (!cart.some(item => item.id === product.id)) {
        cart.push({ id: product.id, name: product.name, price: product.price })
      }

      localStorage.setItem('cart', JSON.stringify(cart))
      setIsAdded(true)
    } catch (cartError) {
      console.error('Failed to update cart', cartError)
      setError('We could not update your cart. Please try again shortly.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!product) {
    return (
      <section className="section-spacing">
        <div className="card border-rose-200 bg-rose-50 text-rose-700">Product not found</div>
      </section>
    )
  }

  return (
    <section className="section-spacing">
      <div className="mb-6">
        <span className="badge mb-3">Clinic shop</span>
        <h1 className="text-3xl font-semibold mb-3">{product.name}</h1>
        <p className="text-slate-600 max-w-2xl">{product.description}</p>
      </div>

      {product.restriction === 'UNRESTRICTED' ? (
        <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
          <div className="card space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-500">Total price</span>
                <div className="text-2xl font-semibold text-primary mt-1">{formatPrice(product.price)}</div>
              </div>
              {isAdded && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  In cart
                </span>
              )}
            </div>

            {product.slug === 'zkteco-fingerprint-scanner' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">Bundle includes</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• ZKTeco biometric fingerprint scanner with USB cable</li>
                  <li>• Secure parcel delivery to your clinic or office</li>
                  <li>• Remote technician support to configure your attendance system</li>
                  <li>• Quick-start checklist prepared by the Mwein IT team</li>
                </ul>
              </div>
            )}

            <div className="space-y-2 text-sm text-slate-600">
              <p>Need onboarding help? Our technicians stay on WhatsApp until you confirm the device is live.</p>
              <p className="text-xs text-slate-500">Device stock is limited—add to cart now and submit the order so we can reserve a unit for you.</p>
            </div>
          </div>

          <aside className="card space-y-4 self-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Secure your order</h2>
              <p className="text-sm text-slate-600">Submit the cart to schedule delivery or pick-up plus your remote onboarding session.</p>
            </div>

            <button
              type="button"
              className="btn-primary w-full justify-center"
              onClick={handleAddToCart}
              disabled={isUpdating || isAdded}
            >
              {isUpdating ? 'Adding…' : isAdded ? 'Added to cart' : 'Add to cart'}
            </button>

            {isAdded && (
              <Link href="/cart" className="btn-outline w-full justify-center">
                Go to cart
              </Link>
            )}

            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Prefer WhatsApp?</p>
              <p className="mt-1">Message <a className="text-primary" href={`https://wa.me/254707711888?text=Hello%20Mwein%2C%20I%20want%20to%20order%20${encodeURIComponent(product.name)}`}>+254 707 711 888</a> for a quick invoice.</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Prescription-only item</h2>
          <p className="text-slate-600">Please <a className="text-primary" href={`https://wa.me/254707711888?text=Hello%20Mwein%2C%20I%20would%20like%20to%20enquire%20about%20${encodeURIComponent(product.name)}`}>enquire via WhatsApp</a> so our pharmacist can review your prescription.</p>
        </div>
      )}
    </section>
  )
}
