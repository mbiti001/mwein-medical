import Link from 'next/link'
import { products } from '../../data/products'
import ProductCard from '../../components/ProductCard'
import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Clinic shop',
  description: 'Order over-the-counter medicines and medical devices from the Mwein Medical Services clinic shop.',
  path: '/shop'
})

export default function Shop() {
  const unrestricted = products.filter(product => product.restriction === 'UNRESTRICTED')
  const restricted = products.filter(product => product.restriction === 'RESTRICTED')

  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-white via-slate-50 to-sky-50 shadow-inset mb-12">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <span className="badge mb-4">Clinic Shop</span>
            <h1>Order clinic-approved essentials</h1>
            <p>
              Pick up over-the-counter medicines and devices in person or request same-day delivery within Mungatsi. Prescription-only items remain enquiry-only to protect patient safety.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://wa.me/254707711888?text=Hello%20Mwein%2C%20I%20would%20like%20to%20order" className="btn-primary">WhatsApp order</a>
              <Link href="/cart" className="btn-outline">View cart</Link>
            </div>
            <ul className="mt-6 text-sm text-slate-600 space-y-2">
              <li>• Pay on collection (cash, M-Pesa Till 8121096) or request delivery rider.</li>
              <li>• Licensed pharmacy team verifies every prescription enquiry before dispatch.</li>
              <li>• Need help choosing a device? Call <a className="underline" href="tel:+254707711888">+254 707 711 888</a>.</li>
            </ul>
          </div>
          <div>
            <div className="card space-y-3">
              <h3 className="mb-1">How ordering works</h3>
              <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                <li>Add unrestricted products to your cart.</li>
                <li>Submit your order or share cart summary via WhatsApp.</li>
                <li>Receive payment instructions (M-Pesa) and pick-up or delivery confirmation.</li>
              </ol>
              <p className="text-xs text-slate-500">Delivery available within Busia County for a small logistics fee. Restricted medicines require valid prescription.</p>
            </div>
          </div>
        </div>
      </section>

      {unrestricted.length > 0 && (
        <section className="section-spacing">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="mb-2">Over-the-counter favourites</h2>
              <p className="text-slate-600 max-w-2xl">Ready-to-dispense medicines and monitoring devices. Add to cart for quick checkout at the clinic counter.</p>
            </div>
            <Link href="/cart" className="btn-outline">Go to cart</Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {unrestricted.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {restricted.length > 0 && (
        <section className="section-spacing bg-surface rounded-3xl border border-slate-100 p-8 md:p-12 mb-12">
          <h2 className="mb-3">Prescription-only items</h2>
          <p className="text-slate-600 max-w-3xl mb-6">
            These medicines require review by our pharmacy team. Share your prescription via WhatsApp or visit the clinic—our pharmacists will verify and advise next steps.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {restricted.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="card mt-8 bg-white">
            <h3 className="mb-2">Need a repeat prescription?</h3>
            <p className="text-sm text-slate-600">Book a review with our clinicians to renew chronic meds safely. Call <a className="text-primary" href="tel:+254707711888">+254707711888</a> or message on WhatsApp.</p>
          </div>
        </section>
      )}

      <section className="section-spacing text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-hover">
        <h2 className="mb-4 text-white">Ready to place your order?</h2>
        <p className="max-w-2xl mx-auto mb-6 text-slate-100">
          Share your cart summary with the pharmacy via WhatsApp or walk into the clinic; we&rsquo;ll have everything packed and verified for you.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="https://wa.me/254707711888?text=Hello%20Mwein%2C%20I%20would%20like%20to%20order" className="btn-primary">WhatsApp order</a>
          <Link href="/contact" className="btn-outline bg-white text-primary">Ask a clinician</Link>
        </div>
      </section>
    </>
  )
}
