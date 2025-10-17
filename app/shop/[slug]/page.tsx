import { products } from '../../../data/products'

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find(p => p.slug === params.slug)
  if (!product) return <div className="text-red-600">Product not found</div>

  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
      <p className="mb-4 text-slate-700">{product.description}</p>
      {product.restriction === 'UNRESTRICTED' ? (
        <div>
          <div className="text-lg font-semibold mb-3">KSh {product.price}</div>
          <button className="bg-primary text-white px-4 py-2 rounded" onClick={() => {
            // client-side add to cart placeholder
            const cart = JSON.parse(localStorage.getItem('cart') || '[]')
            cart.push({ id: product.id, name: product.name, price: product.price })
            localStorage.setItem('cart', JSON.stringify(cart))
            alert('Added to cart')
          }}>Add to cart</button>
        </div>
      ) : (
        <div>
          <p className="text-slate-600">Restricted item — please <a className="text-primary" href={`https://wa.me/254707711888?text=Hello%20Mwein%2C%20I%20would%20like%20to%20enquire%20about%20${encodeURIComponent(product.name)}`}>enquire via WhatsApp</a>.</p>
        </div>
      )}
    </section>
  )
}
