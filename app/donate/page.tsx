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
      <p className="mb-3">Every month we treat mothers, newborns, and children who arrive in crisis without a way to pay. Your contribution keeps lifesaving care available even when a family&rsquo;s finances fall short.</p>
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="card space-y-2">
          <h3 className="text-lg font-semibold">Why your donation matters</h3>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>A mother who delivers safely but needs an urgent ambulance transfer when complications arise within hours of birth.</li>
            <li>Newborns requiring oxygen, incubator care, or antibiotics while parents scramble to fundraise.</li>
            <li>Children fighting severe malaria or pneumonia who need medication immediately, not when funds become available.</li>
            <li>Restocking emergency consumables—sterile kits, IV fluids, rapid tests—so our team never hesitates to act.</li>
          </ul>
        </div>
        <div className="card space-y-2">
          <h3 className="text-lg font-semibold">What your gift unlocks</h3>
          <p className="text-slate-600">Donations fuel a compassionate contingency fund that allows us to:</p>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>Waive or subsidize bills for emergency deliveries and neonatal care.</li>
            <li>Dispatch referral transport immediately when minutes matter.</li>
            <li>Keep child-friendly formulations of antimalarials, antibiotics, and oxygen supplies stocked.</li>
            <li>Maintain a reserve of consumables for community outreach clinics in remote villages.</li>
          </ul>
        </div>
      </div>
      <div className="p-4 card space-y-3">
        <div>
          <p><strong>M-Pesa Till:</strong> 8121096</p>
          <p className="text-sm text-slate-600">Share the confirmation SMS with our team for a receipt.</p>
        </div>
        <div>
          <p><strong>PayPal:</strong> <a href="https://www.paypal.com/paypalme/mweinmedical" className="text-primary">paypal.me/mweinmedical</a></p>
          <p className="text-sm text-slate-600">You can also send via PayPal using <strong>mweinmedical@gmail.com</strong>.</p>
        </div>
        <p className="mt-1">For questions or receipts, WhatsApp <a href="https://wa.me/254707711888" className="text-primary">+254707711888</a>.</p>
        <p className="mt-2">Thank you for supporting community healthcare.</p>
      </div>
    </section>
  )
}
