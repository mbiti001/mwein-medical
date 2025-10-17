import Link from 'next/link'
import { buildPageMetadata } from '../../lib/metadata'

const serviceLinks = [
  {
    href: '/services/outpatient',
    title: 'Outpatient Care',
    copy: 'Preventive care, chronic disease management, immunizations, and same-day attention where possible.'
  },
  {
    href: '/services/laboratory',
    title: 'Laboratory',
    copy: 'Rapid diagnostic tests, full haemogram, antenatal profiles, and wellness screening.'
  },
  {
    href: '/services/ultrasound',
    title: 'Ultrasound',
    copy: 'Obstetric, abdominal, and pelvic scans with clear reporting and referrals when needed.'
  },
  {
    href: '/services/antenatal',
    title: 'Antenatal & Maternal Care',
    copy: 'Routine ANC visits, counselling, emergency referral coordination, and safe delivery planning.'
  },
  {
    href: '/services/child-wellness',
    title: 'Child Wellness & Immunizations',
    copy: 'Growth monitoring, nutrition guidance, and KEPI/Kenya Expanded Programme on Immunization support.'
  },
  {
    href: '/services/chronic-care',
    title: 'Chronic Care Clinics',
    copy: 'Hypertension, diabetes, asthma, and sickle cell reviews with medication management and lifestyle coaching.'
  },
  {
    href: '/services/minor-procedures',
    title: 'Minor Procedures',
    copy: 'Wound suturing, keloid removal, circumcision, abscess drainage, and related minor surgical care.'
  },
  {
    href: '/services/pharmacy',
    title: 'Pharmacy',
    copy: 'Safe dispensing, adherence counselling, and enquiry-only handling for restricted medicines.'
  },
]

export const metadata = buildPageMetadata({
  title: 'Medical services',
  description: 'Outpatient, diagnostic, maternal, and chronic care services available 24/7 at Mwein Medical Services in Mungatsi.',
  path: '/services'
})

export default function Services() {
  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-white via-slate-50 to-sky-50 shadow-inset mb-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge mb-4">Services & Clinics</span>
            <h1>Complete care for every family member</h1>
            <p>
              From preventive screenings to specialist consults, our clinicians coordinate the right care close to home.
              Walk in any time — we&rsquo;re open <strong>24 hours every day</strong>, or book a slot to skip the queue.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Book an appointment</Link>
              <a href="tel:+254707711888" className="btn-outline">Call +254 707 711 888</a>
            </div>
            <ul className="mt-6 space-y-2 text-slate-600">
              <li>✓ SHA & Yatta insurance accepted (more partners coming soon)</li>
              <li>✓ On-site lab & pharmacy</li>
              <li>✓ Emergency coordination with Busia County facilities</li>
            </ul>
          </div>
          <div>
            <div className="card space-y-4">
              <div>
                <h3>Same-day support</h3>
                <p className="text-sm text-slate-500">
                  Our triage nurses escalate urgent cases immediately while our clinicians manage ongoing treatment plans.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <p className="rounded-lg border border-dashed border-slate-200 p-3 bg-white">Walk-in primary care</p>
                <p className="rounded-lg border border-dashed border-slate-200 p-3 bg-white">Maternal & child health</p>
                <p className="rounded-lg border border-dashed border-slate-200 p-3 bg-white">Diagnostics on-site</p>
                <p className="rounded-lg border border-dashed border-slate-200 p-3 bg-white">Telehealth follow-ups</p>
              </div>
              <p className="text-xs text-slate-500">Need ambulance transport? Call ahead—we&rsquo;ll coordinate with partner facilities.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="mb-2">Browse services by department</h2>
            <p className="text-slate-600 max-w-2xl">Tap a service to see hours, clinicians, protocols, and preparation tips before your visit.</p>
          </div>
          <Link href="/shop" className="btn-outline">Shop clinic essentials</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {serviceLinks.map(service => (
            <Link key={service.href} href={service.href} className="card block group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-2">{service.title}</h3>
                  <p>{service.copy}</p>
                </div>
                <span className="text-primary-light font-semibold group-hover:text-primary">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-spacing bg-surface rounded-3xl border border-slate-100 p-8 md:p-12 mb-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h3>Diagnostics & monitoring</h3>
            <p className="text-slate-600">Full haemogram, malaria, HIV, antenatal, chemistry panels, ECGs, and ultrasound services on-site.</p>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Results ready in minutes for rapid tests</li>
              <li>• Electronic reports shared securely on request</li>
              <li>• Partner labs engaged for specialized panels</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3>Maternal & child health</h3>
            <p className="text-slate-600">Experienced midwives and paediatric clinicians guide ANC journeys, newborn reviews, and immunization schedules.</p>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Focus on respectful maternity care</li>
              <li>• Emergency referral pathways to Busia County Hospital</li>
              <li>• Nutrition, breastfeeding, and family planning support</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3>Chronic & urgent care</h3>
            <p className="text-slate-600">Regular specialist-run clinics and after-hours coverage ensure continuity for chronic and urgent needs.</p>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Hypertension, diabetes, epilepsy, and sickle cell reviews</li>
              <li>• 24/7 on-call clinician for emergencies</li>
              <li>• Home visits available on arrangement</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-spacing text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-hover">
        <h2 className="mb-4 text-white">Ready to visit Mwein Medical?</h2>
        <p className="max-w-2xl mx-auto mb-6 text-slate-100">
          Call ahead or send your details online—we&rsquo;ll confirm appointment time, preparation steps, and insurance cover before you arrive.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary">Book online</Link>
          <a href="https://wa.me/254707711888" className="btn-outline bg-white text-primary">WhatsApp the clinic</a>
        </div>
      </section>
    </>
  )
}
