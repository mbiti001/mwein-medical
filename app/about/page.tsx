import Link from 'next/link'
import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'About the clinic',
  description: 'Meet the team and mission driving 24/7 compassionate care at Mwein Medical Services in Mungatsi.',
  path: '/about'
})

export default function About() {
  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-br from-white via-slate-50 to-sky-50 shadow-inset mb-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div>
            <span className="badge mb-4">About Mwein Medical</span>
            <h1>Community-first care, every hour</h1>
            <p className="text-lg text-slate-600">
              We’re a round-the-clock clinic anchored in Mungatsi, Busia County. Nurses, clinicians, midwives, and lab technologists rotate shifts so emergencies are stabilised, mothers are supported, and chronic care stays on track—whether it’s 2 p.m. or 2 a.m.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="contact-tile">
                <span className="text-2xl" aria-hidden>🕒</span>
                <span className="contact-tile-title">Open 24/7</span>
                <span className="contact-tile-meta">Walk in anytime or book ahead.</span>
              </div>
              <div className="contact-tile">
                <span className="text-2xl" aria-hidden>📍</span>
                <span className="contact-tile-title">Located in Mungatsi</span>
                <span className="contact-tile-meta">Along Busia–Malaba Road, next to the market stage.</span>
              </div>
            </div>
          </div>
          <div className="card space-y-4">
            <h3 className="text-2xl font-semibold">Our promise</h3>
            <p className="text-slate-600">Every patient deserves respectful, confidential, and practical care without leaving their community. We combine prevention, early detection, and rapid response so families stay healthy close to home.</p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Respectful maternity care with emergency referral pathways</li>
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Family planning options ready daily—implants, IUCDs, injectables, pills</li>
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3">Rapid diagnostics, on-site pharmacy, and clinician follow-up notes</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card space-y-3">
            <span className="badge">Mission</span>
            <h3>Accessible, high-quality care</h3>
            <p className="text-sm text-slate-600">
              Deliver dependable primary and emergency care for every family in Busia County—without long travel times or delayed referrals.
            </p>
          </div>
          <div className="card space-y-3">
            <span className="badge">Vision</span>
            <h3>Staying healthy close to home</h3>
            <p className="text-sm text-slate-600">
              Scale community-based clinics that blend technology, on-call specialists, and local partnerships to keep care within reach.
            </p>
          </div>
          <div className="card space-y-3">
            <span className="badge">Values</span>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Compassion and confidentiality for every patient</li>
              <li>• Timely escalation for emergencies day or night</li>
              <li>• Preventive focus anchored in family education</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-surface rounded-3xl border border-slate-100 p-8 md:p-12 mb-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-slate-900">Led by specialists invested in Busia County</h2>
            <p className="text-slate-600">Our leadership team combines public health, emergency medicine, and operations expertise. On any shift you’ll find a clinician-in-charge, triage nurse, and lab technologist working in sync.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="contact-tile">
                <span className="contact-tile-title">Mary Wanyama</span>
                <span className="contact-tile-meta">Clinical Director · SRN</span>
                <p className="text-sm text-slate-600">Leads quality improvement, respectful maternity care, and community outreach.</p>
              </div>
              <div className="contact-tile">
                <span className="contact-tile-title">Dr. Brian Mbiti</span>
                <span className="contact-tile-meta">Medical Lead · MBChB</span>
                <p className="text-sm text-slate-600">Oversees emergency readiness, chronic care clinics, and telehealth follow-up.</p>
              </div>
            </div>
          </div>
          <div className="card space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Milestones so far</h3>
            <ol className="relative border-l border-slate-200 pl-6 space-y-5 text-sm text-slate-600">
              <li>
                <span className="absolute -left-[11px] mt-1 block h-3 w-3 rounded-full bg-primary" aria-hidden />
                <p className="font-semibold text-slate-800">2023 — Clinic opens doors</p>
                <p>Outpatient services launch with 24-hour coverage and family planning clinic.</p>
              </li>
              <li>
                <span className="absolute -left-[11px] mt-1 block h-3 w-3 rounded-full bg-primary" aria-hidden />
                <p className="font-semibold text-slate-800">2024 — Diagnostic wing expands</p>
                <p>Laboratory and ultrasound suites come online with same-day reporting.</p>
              </li>
              <li>
                <span className="absolute -left-[11px] mt-1 block h-3 w-3 rounded-full bg-primary" aria-hidden />
                <p className="font-semibold text-slate-800">2025 — Telehealth & outreach</p>
                <p>Remote consultations, chronic care reviews, and home visit program scale countywide.</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section-spacing text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-hover">
        <h2 className="mb-4 text-white">Partner with Mwein Medical</h2>
        <p className="max-w-3xl mx-auto mb-6 text-slate-100">
          We welcome collaborators, volunteers, and donors who believe in community-first healthcare. Let’s build responsive clinics that keep families safe without leaving Busia County.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/donate" className="btn-primary">Support our work</Link>
          <Link href="/contact" className="btn-outline bg-white text-primary">Book a visit</Link>
        </div>
      </section>
    </>
  )
}
