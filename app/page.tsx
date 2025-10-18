import Link from 'next/link'
import { buildPageMetadata } from '../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Home',
  description: 'Comprehensive 24/7 medical services, laboratory, and maternal care for families in Mungatsi, Busia County.',
  path: '/'
})

export default function Home() {
  return (
    <>
      <section className="section-spacing rounded-3xl mb-12 bg-gradient-to-br from-white via-slate-50 to-sky-50 shadow-inset">
        <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="badge mb-4">Trusted community clinic</span>
            <h1>Mwein Medical Services</h1>
            <p className="text-xl text-slate-700 italic">Exceptional care close to you, every hour of the day.</p>
            <p className="mb-6 text-lg text-slate-600">
              Community clinic in <strong>Mungatsi, Busia County</strong>. Open <strong>24 hours, 7 days a week</strong>. We stabilise emergencies, support mothers, and run chronic care clinics so families stay healthy close to home.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="contact-tile">
                <span className="contact-tile-title">Family planning daily</span>
                <p className="contact-tile-meta">Implants, IUCDs, injectables, and counselling on-site.</p>
              </div>
              <div className="contact-tile">
                <span className="contact-tile-title">Emergency-ready</span>
                <p className="contact-tile-meta">On-call clinicians, oxygen, and partner ambulances 24/7.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Book appointment</Link>
              <a href="tel:+254707711888" className="btn-outline">Call +254 707 711 888</a>
              <a href="https://wa.me/254707711888" className="btn-outline">WhatsApp triage</a>
              <Link href="/cancer-screening" className="btn-outline">Cancer screening guide</Link>
              <Link href="/mental-health" className="btn-outline">Mental health check-in</Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              SHA and Yatta Insurance accepted; more partners onboarding soon. Need help with transport or referrals? Call ahead and we’ll coordinate for you.
            </p>
          </div>
          <div className="card space-y-5">
            <div className="space-y-2">
              <h3>Key services</h3>
              <p className="text-sm text-slate-500">Comprehensive support for families, expectant mothers, and chronic care patients—day or night.</p>
            </div>
            <ul className="grid grid-cols-2 gap-2 text-slate-700">
              <li>Outpatient Care</li>
              <li>Laboratory</li>
              <li>Ultrasound</li>
              <li>Antenatal Care</li>
              <li>Child Wellness</li>
              <li>Chronic Care</li>
              <li>Minor Procedures</li>
              <li>Pharmacy</li>
            </ul>
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <p className="text-sm text-slate-600">
                Need virtual care? Our telehealth team reviews symptoms, confirms payment, and issues e-prescriptions within the same day.
              </p>
              <Link href="/services/telehealth" className="form-hint underline">See telehealth workflow →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card space-y-3">
            <span className="badge">Fast triage</span>
            <h3>Emergency hotline</h3>
            <p className="text-sm text-slate-600">Dial <a href="tel:+254707711888" className="underline">+254 707 711 888</a> and our clinician dispatches transport or stabilisation support immediately.</p>
          </div>
          <div className="card space-y-3">
            <span className="badge">Visitors this month</span>
            <h3>Community trust is growing</h3>
            <p className="text-sm text-slate-600">Hundreds of families walk in every month for antenatal care, chronic clinics, and after-hours emergencies.</p>
          </div>
          <div className="card space-y-3">
            <span className="badge">Support the mission</span>
            <h3>Donations keep oxygen flowing</h3>
            <p className="text-sm text-slate-600">Every gift restocks emergency medicines, funds outreach, and fuels transport for critical referrals.</p>
            <Link href="/donate" className="btn-outline">See how donations help</Link>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="mb-2">More from Mwein</h2>
            <p className="text-slate-600 max-w-2xl">Explore how our nurses, clinicians, and specialists work together to keep your family healthy at every life stage.</p>
          </div>
          <Link href="/services" className="btn-outline">Browse services</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card h-full">
            <h3 className="mb-2">Primary Care</h3>
            <p>Routine checkups, chronic disease management, preventive screenings, and family planning support.</p>
          </div>
          <div className="card h-full">
            <h3 className="mb-2">Specialty Clinics</h3>
            <p>Visiting consultants for cardiology, endocrinology, obstetrics, and surgical reviews without traveling to the city.</p>
          </div>
          <div className="card h-full">
            <h3 className="mb-2">Telehealth</h3>
            <p>Virtual visits for non-emergency consultations, medication refills, and follow-up reviews wherever you are.</p>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-surface rounded-3xl border border-slate-100 p-8 md:p-12 mb-12">
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <div className="space-y-3">
            <h3>Your next steps</h3>
            <p className="text-slate-600">Whether you need an urgent review, routine clinic visit, or telehealth consult, we’ll match you with the right clinician and confirm preparation details before you arrive.</p>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Share your symptoms or request via the booking form</li>
              <li>• Receive a confirmation call with insurance and preparation notes</li>
              <li>• Walk in or connect via telehealth knowing your clinician is ready</li>
            </ul>
          </div>
          <div className="card space-y-4">
            <h4 className="font-semibold text-slate-900">Ready when you are</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/contact" className="btn-primary justify-center">Book now</Link>
              <a href="https://wa.me/254707711888" className="btn-outline justify-center">WhatsApp updates</a>
            </div>
            <p className="text-sm text-slate-600">Need a detailed service guide? Explore our <Link href="/services" className="underline">departments</Link> or visit the <Link href="/services/outpatient" className="underline">outpatient hub</Link>.</p>
          </div>
        </div>
      </section>
    </>
  )
}
