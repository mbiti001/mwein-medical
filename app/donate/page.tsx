import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Donate',
  description: 'Support community healthcare in Mungatsi by contributing to Mwein Medical Services operations.',
  path: '/donate'
})

export default function Donate() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-3">Support Mwein Medical Services</h2>
      <p className="mb-4">Your gift helps keep essential services—like immunizations, rapid tests, and maternal care—within reach for families in Mungatsi. Even small donations help cover test kits, vaccine storage, and transport for referrals.</p>
      <div className="p-4 card">
        <p><strong>M-Pesa Till:</strong> 8121096</p>
        <p className="mt-2">For questions or receipts, WhatsApp <a href="https://wa.me/254707711888" className="text-primary">+254707711888</a></p>
        <p className="mt-4">Thank you for supporting community healthcare.</p>
      </div>
    </section>
  )
}
