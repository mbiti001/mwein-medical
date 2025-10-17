import { buildPageMetadata } from '../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Home',
  description: 'Comprehensive 24/7 medical services, laboratory, and maternal care for families in Mungatsi, Busia County.',
  path: '/'
})

export default function Home() {
  return (
    <>
      <section className="section-spacing rounded-2xl mb-8 bg-gradient-to-r from-white via-slate-50 to-sky-50 shadow-inset">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="badge mb-4">Trusted community clinic</span>
            <h1>Mwein Medical Services</h1>
            <p className="text-xl text-slate-700 italic">Exceptional care close to you, every hour of the day.</p>
            <p className="mb-8">
              Community clinic in <strong>Mungatsi, Busia County</strong>. Open <strong>24 hours, 7 days a week</strong>. We provide the full mix of family planning methods on-site, stabilise emergencies every minute, and accept <strong>SHA</strong> plus <strong>Yatta Insurance</strong> while onboarding additional partners.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/20 bg-white/60 p-4 shadow-sm">
                <p className="text-sm font-semibold text-primary">All family planning methods available daily</p>
                <p className="text-xs text-slate-600">Implants, IUCDs, injectables, oral contraception, counselling, and same-day reviews.</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-white/60 p-4 shadow-sm">
                <p className="text-sm font-semibold text-primary">Emergency-ready every minute</p>
                <p className="text-xs text-slate-600">On-call clinicians, oxygen, and referral transport coordination around the clock.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/contact" className="btn-primary">Book appointment</a>
              <a href="tel:+254707711888" className="btn-outline">Call +254 707 711 888</a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Prefer WhatsApp? Message us anytime at <a href="https://wa.me/254707711888" className="underline">+254707711888</a> for quick triage.
            </p>
          </div>
          <div>
            <div className="card space-y-4">
              <div>
                <h3>Key Services</h3>
                <p className="text-sm text-slate-500">Comprehensive support for families, expectant mothers, and chronic care patients.</p>
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
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="mb-2">More from Mwein</h2>
            <p className="text-slate-600 max-w-2xl">Explore how our nurses, clinicians, and specialists work together to keep your family healthy at every life stage.</p>
          </div>
          <a href="/services" className="btn-outline">Browse services</a>
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
    </>
  )
}
