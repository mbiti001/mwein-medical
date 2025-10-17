import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Terms & conditions',
  description: 'Review the simple terms governing website use, clinic orders, and prescription-only services.',
  path: '/terms'
})

export default function Terms() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-3">Terms & Conditions</h2>
      <p className="mb-4">Use of this site and the online shop are subject to simple terms: products are subject to availability; restricted items require enquiry and possible in‑clinic review. The clinic may refuse orders that compromise safety or violate local regulations.</p>
    </section>
  )
}
