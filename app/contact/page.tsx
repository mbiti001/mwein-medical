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
    <section className="section-spacing">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] items-start">
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-8 md:p-10 shadow-inset">
            <span className="badge mb-4">Talk to us anytime</span>
            <h1 className="mb-4">Let’s coordinate your visit</h1>
            <p className="text-lg text-slate-600">
              Our triage team monitors calls, WhatsApp, and the booking form 24 hours a day. Share what you need and we’ll secure the right clinician, confirm insurance cover, and prep the treatment room before you arrive.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a href="tel:+254707711888" className="contact-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Call the clinic">
                <span className="text-2xl" aria-hidden>📞</span>
                <span className="contact-tile-title">Call the clinic</span>
                <span className="contact-tile-meta">+254 707 711 888</span>
                <span className="contact-tile-meta">Answered within minutes</span>
              </a>
              <a href="https://wa.me/254707711888" className="contact-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Chat on WhatsApp">
                <span className="text-2xl" aria-hidden>💬</span>
                <span className="contact-tile-title">WhatsApp triage</span>
                <span className="contact-tile-meta">+254 707 711 888</span>
                <span className="contact-tile-meta">Send updates anytime</span>
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Prefer email? Write to <a href="mailto:mweinmedical@gmail.com" className="underline">mweinmedical@gmail.com</a> and attach summaries or reports.
            </p>
          </div>

          <div className="card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="mb-1 text-xl font-semibold text-slate-900">Telehealth consultation payment</h3>
                <p className="text-sm text-slate-500">Secure your virtual slot in minutes.</p>
              </div>
              <span className="badge">KES 500 per session</span>
            </div>
            <p className="text-sm text-slate-600">
              Pay via <strong>M-Pesa Till 8121096</strong> (reference “telehealth”) or PayPal to <strong>mweinmedical@gmail.com</strong>. Share the transaction code in the form or on WhatsApp so we can confirm your slot quickly.
            </p>
            <p className="text-sm text-slate-600">Before the call, include:</p>
            <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Reason for consultation and duration of symptoms</li>
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Key medical history (chronic illnesses, surgeries, pregnancies)</li>
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Current medications, supplements, and allergies</li>
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Recent vitals or labs (BP, glucose, imaging)</li>
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Best phone number plus a backup contact</li>
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Preferred pharmacy for e-prescriptions or delivery</li>
            </ul>
            <p className="form-hint">
              Need the full workflow? Review our{' '}
              <Link href="/services/telehealth" className="underline">telehealth consultation guide</Link> for preparation and follow-up expectations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="contact-tile">
              <span className="text-2xl" aria-hidden>🕒</span>
              <span className="contact-tile-title">Always open</span>
              <p className="contact-tile-meta">Walk in any hour — our clinicians rotate shifts so care never pauses.</p>
            </div>
            <div className="contact-tile">
              <span className="text-2xl" aria-hidden>📍</span>
              <span className="contact-tile-title">Find us in Mungatsi</span>
              <p className="contact-tile-meta">Along Busia–Malaba Road, next to the market stage. Parking and boda drop-off available.</p>
            </div>
          </div>
        </div>

        <div className="card space-y-6 p-6 md:p-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">Request a visit online</h2>
            <p className="form-hint">Share a few details and we’ll call back to lock in your preferred time.</p>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
