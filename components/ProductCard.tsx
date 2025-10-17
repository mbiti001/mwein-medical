import Link from 'next/link'
import { MessageCircle, ShoppingCart } from 'lucide-react'
import { Product } from '../data/products'

const formatPrice = (value?: number) => {
  if (typeof value !== 'number') return null
  return `KSh ${value.toLocaleString('en-KE')}`
}

export default function ProductCard({ product }: { product: Product }) {
  const price = formatPrice(product.price)
  const isRestricted = product.restriction === 'RESTRICTED'

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold leading-snug mb-1">{product.name}</h3>
          {price && <span className="text-primary font-semibold text-sm">{price}</span>}
        </div>
        <span className={`badge ${isRestricted ? 'badge-restricted' : 'badge-otc'}`}>
          {isRestricted ? 'Prescription' : 'OTC'}
        </span>
      </div>

      <p className="text-sm text-slate-600 flex-1">{product.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {isRestricted ? (
          <a
            className="btn-outline text-sm"
            href={`https://wa.me/254707711888?text=Hello%20Mwein%2C%20I%20would%20like%20to%20enquire%20about%20${encodeURIComponent(product.name)}`}
          >
            <MessageCircle size={16} /> Enquire via WhatsApp
          </a>
        ) : (
          <>
            <Link href={`/shop/${product.slug}`} className="btn-primary text-sm">
              <ShoppingCart size={16} /> View & add to cart
            </Link>
            <a
              className="btn-outline text-sm"
              href={`https://wa.me/254707711888?text=Hello%20Mwein%2C%20I%20want%20to%20order%20${encodeURIComponent(product.name)}`}
            >
              <MessageCircle size={16} /> Quick order
            </a>
          </>
        )}
      </div>
    </div>
  )
}
