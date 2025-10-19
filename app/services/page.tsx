import Link from 'next/link'
import { buildPageMetadata } from '../../lib/metadata'
import { serviceLines } from '../../data/serviceLines'

const preparationSteps = [
  'Share your visit reason via the booking form or WhatsApp so we prep the right room and clinician.',
  'Carry previous summaries, imaging, or clinic cards—our team scans them into your digital chart.',
  'Arrive 10 minutes early for vitals; fasting labs need water only for 8 hours unless advised otherwise.',
  'Bring insurance cards or mobile money confirmation. SHA and Yatta are accepted; others are processed with advance notice.'
]

const quickResources = [
  {
    href: '/services/outpatient',
    label: 'Outpatient visit flow',
    description: 'Understand check-in, diagnostics, and pharmacy steps before you arrive.'
  },
  {
    href: '/services/telehealth',
    label: 'Telehealth & follow-ups',
    description: 'Book virtual reviews, medication refills, and home visit coordination.'
  },
  {
    href: '/services/minor-procedures',
    label: 'Minor procedures list',
    description: 'See day theatre capabilities, preparation tips, and aftercare plans.'
  },
  {
    href: '/cancer-screening',
    label: 'Cancer screening drive',
    description: 'Access VIA/VILI, breast exams, and referral support close to home.'
  }
]

export const metadata = buildPageMetadata({
  title: 'Medical services',
  description: 'Four integrated service lines covering outpatient, maternal, diagnostics, and telehealth support at Mwein Medical Services.',
  path: '/services'
})

export default function Services() {
  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-white via-slate-50 to-sky-50 shadow-inset mb-12">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <div className="space-y-5">
            <span className="badge">Services & clinics</span>
            <h1 className="max-w-2xl">Care pathways designed to keep treatment under one roof</h1>
            <p className="text-lg text-slate-600 max-w-3xl">
              We group every visit into four service lines so appointments are clear, evidence-based, and coordinated. Whether you walk in or schedule, our team triages, investigates, and follows up without repeating steps.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Plan your visit</Link>
              <a href="tel:+254707711888" className="btn-outline">Call +254 707 711 888</a>
              <a href="https://wa.me/254707711888" className="btn-outline">WhatsApp triage</a>
            </div>
            <p className="text-sm text-slate-500 max-w-xl">
              Insurance ready · 24/7 emergency coverage · Visiting specialists weekly · Telehealth follow-ups after discharge.
            </p>
          </div>
          <div className="card space-y-5">
            <h3 className="text-lg font-semibold text-slate-900">What to expect during any visit</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>Reception books you in, checks insurance eligibility, and alerts triage nurses.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>Triage captures vitals while clinicians review your chart and line up diagnostics.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>Diagnostics run in-parallel; results sync to the clinician’s tablet instantly.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">4</span>Pharmacy, referrals, and follow-up notes are issued before you leave.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Explore our four service lines</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {serviceLines.map((line) => (
            <article key={line.id} className="card h-full space-y-6 border border-slate-100 bg-white shadow-sm transition hover:shadow-lg">
              <div className="space-y-2">
                <span className="badge bg-primary/10 text-primary">{line.name}</span>
                <h3 className="text-lg font-semibold text-slate-900">{line.tagline}</h3>
                <p className="text-sm text-slate-600">{line.summary}</p>
              </div>
              <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
                {line.offerings.map((offering) => (
                  <div key={offering.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="font-semibold text-slate-900">{offering.title}</p>
                    <p className="mt-2 text-slate-600">{offering.description}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                {line.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/5 text-primary text-xs font-semibold">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href={line.href} className="btn-outline">Dive into {line.name.toLowerCase()}</Link>
                {line.links.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm font-medium text-primary underline underline-offset-4">
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-spacing rounded-3xl border border-slate-100 bg-surface p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold text-slate-900">Prepare once, use everywhere</h2>
            <p className="text-slate-600">Give us your details one time and every clinician—whether outpatient, maternal, diagnostics, or telehealth—works from the same chart.</p>
            <ul className="space-y-3 text-sm text-slate-600">
              {preparationSteps.map((step) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">✓</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Need to coordinate extra support?</h3>
            <p className="text-sm text-slate-600">Our admin team lines up partner ambulances, donor-funded fee waivers, or private rooms when needed. Let us know in advance so arrival is stress-free.</p>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-sm text-slate-700 space-y-3">
              <p className="font-semibold text-primary">Screened waivers only</p>
              <p>We validate every financial aid case inside the clinic and log fee waivers in our internal ledger before any donor funds are released.</p>
              <p className="font-semibold text-primary">How to request help</p>
              <p>Visit the clinic or call <a className="underline" href="tel:+254707711888">+254 707 711 888</a>. Our team will assess the case, capture documentation, and add it to the accountability register for supporters.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Popular resources</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickResources.map((resource) => (
            <Link key={resource.href} href={resource.href} className="card block h-full space-y-3 border border-slate-100 bg-white shadow-sm transition hover:shadow-lg">
              <h3 className="text-base font-semibold text-slate-900">{resource.label}</h3>
              <p className="text-sm text-slate-600">{resource.description}</p>
              <span className="text-sm font-semibold text-primary">View details →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-spacing text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-hover">
        <h2 className="mb-4 text-white">Ready to visit Mwein Medical?</h2>
        <p className="max-w-2xl mx-auto mb-6 text-slate-100">
          Call ahead or send your details online—we’ll confirm appointment time, preparation steps, and insurance cover before you arrive.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary">Book online</Link>
          <a href="https://wa.me/254707711888" className="btn-outline bg-white text-primary">WhatsApp the clinic</a>
        </div>
      </section>
    </>
  )
}
