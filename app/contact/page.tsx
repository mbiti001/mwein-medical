import Link from 'next/link'
import ContactForm from '../../components/ContactForm'
import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Contact & bookings',
  description: 'Reach the Mwein Medical Services team 24/7 by phone, WhatsApp, or appointment form.',
  path: '/contact'
})

export default function Contact() {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-4">Contact us</h2>
      <p className="mb-3">
        Call <a href="tel:+254707711888" className="text-primary">+254707711888</a> or WhatsApp
        {' '}
        <a href="https://wa.me/254707711888" className="text-primary">+254707711888</a>
        {' '}anytime — our team monitors lines 24/7.
      </p>
      <div className="card space-y-3 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-xl font-semibold text-slate-900">Telehealth consultation payment</h3>
          <span className="badge">KES 500 per session</span>
        </div>
        <p className="text-sm text-slate-600">
          Pay via <strong>M-Pesa Till 8121096</strong> (reference “telehealth”) or PayPal to <strong>mweinmedical@gmail.com</strong>. Share the transaction code when you submit this form so we can confirm your slot quickly.
        </p>
        <p className="text-sm text-slate-600">
          Before the call, please include these essentials in your message:
        </p>
        <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-3">Reason for consultation and how long symptoms have been present</li>
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-3">Key medical history (chronic illnesses, surgeries, pregnancies)</li>
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-3">Current medications, supplements, and any known allergies</li>
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-3">Recent vitals or test results (BP, blood sugar, labs, imaging)</li>
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-3">Best number for the call and a backup contact in case of poor network</li>
          <li className="rounded-lg border border-dashed border-slate-200 bg-white p-3">Preferred pharmacy for e-prescriptions or delivery instructions</li>
        </ul>
        <p className="text-xs text-slate-500">
          Need more detail? Review our <Link href="/services/telehealth" className="text-primary underline">telehealth consultation guide</Link> for the full process and follow-up expectations.
        </p>
      </div>
      <ContactForm />
    </section>
  )
}
