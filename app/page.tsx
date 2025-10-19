import Link from 'next/link'
import dynamic from 'next/dynamic'
import { buildPageMetadata } from '../lib/metadata'
import { serviceLines } from '../data/serviceLines'

const DonationSnake = dynamic(() => import('../components/DonationSnake'))

const accessOptions = [
  {
    title: 'Walk in 24/7',
    description: 'Clinicians, nurses, laboratory, and pharmacy teams are on-site day and night for urgent or routine care.',
    action: { label: 'Get directions', href: 'https://maps.app.goo.gl/kdfx6sv4cfhKZyTh9' }
  },
  {
    title: 'Book ahead',
    description: 'Share symptoms or preferred times and we’ll line up the right clinician, investigations, and payment notes.',
    action: { label: 'Book appointment', href: '/contact' }
  },
  {
    title: 'Telehealth follow-up',
    description: 'Secure video or phone reviews keep you connected to your clinician, with prescriptions and labs sent instantly.',
    action: { label: 'See telehealth flow', href: '/services/telehealth' }
  }
]

const communityHighlights = [
  {
    title: 'Emergency-ready',
    copy: 'On-call clinicians coordinate oxygen, IV therapy, and partner ambulances within minutes.',
    badge: 'Rapid triage'
  },
  {
    title: 'Trusted by families',
    copy: 'Hundreds of mothers, children, and chronic care patients choose Mwein every month for continuous support.',
    badge: 'Growing impact'
  },
  {
    title: 'Fuel the mission',
    copy: 'Donor gifts keep the oxygen plant running, support outreach clinics, and waive fees for families in crisis.',
    badge: 'Community funded',
    link: { label: 'Support our work', href: '/donate' }
  }
]

export const metadata = buildPageMetadata({
  title: 'Home',
  description: 'Comprehensive 24/7 medical services, laboratory, maternal, and telehealth support for families in Mungatsi, Busia County.',
  path: '/'
})

export default function Home() {
  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-br from-white via-slate-50 to-sky-50 shadow-inset mb-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <span className="badge">24/7 community clinic</span>
            <div className="space-y-4">
              <h1 className="max-w-2xl">Exceptional care close to you</h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                Mwein Medical Services keeps emergencies, chronic clinics, maternal journeys, and diagnostics under one roof. Walk in anytime or book ahead—we’ll coordinate everything before you arrive.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Book a visit</Link>
              <a href="tel:+254707711888" className="btn-outline">Call +254 707 711 888</a>
              <a href="https://wa.me/254707711888" className="btn-outline">WhatsApp triage</a>
            </div>
            <p className="text-sm text-slate-500 max-w-xl">
              SHA and Yatta Insurance accepted · Partner ambulances on standby · Telehealth follow-up for every discharge.
            </p>
          </div>
          <div className="card space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-slate-900">How we keep visits smooth</h3>
              <p className="text-sm text-slate-600">We triage within five minutes, run labs while you see the clinician, and hand prescriptions to the pharmacy without extra queues.</p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">✓</span>Digital notes shared with your next clinician.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">✓</span>Insurance pre-authorisation before procedures.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">✓</span>Transport organised for referrals or home visits.</li>
            </ul>
            <Link href="/services" className="btn-outline w-full justify-center">Explore all services</Link>
          </div>
        </div>
      </section>

  <DonationSnake />

  <section className="section-spacing">
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Where we focus your care</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {serviceLines.map(line => (
            <article key={line.id} className="card h-full space-y-5 border border-slate-100 bg-white shadow-sm transition hover:shadow-lg">
              <div className="space-y-2">
                <span className="badge bg-primary/10 text-primary">{line.name}</span>
                <h3 className="text-lg font-semibold text-slate-900">{line.tagline}</h3>
                <p className="text-sm text-slate-600">{line.summary}</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                {line.highlights.map(highlight => (
                  <li key={highlight} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/5 text-primary text-xs font-semibold">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={line.href} className="btn-outline">Explore {line.name.toLowerCase()}</Link>
                {line.links.slice(0, 1).map(link => (
                  <Link key={link.href} href={link.href} className="text-sm font-medium text-primary underline underline-offset-4">{link.label}</Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-spacing rounded-3xl border border-slate-100 bg-surface p-6 sm:p-8 md:p-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Choose the access that suits you</h2>
            <p className="max-w-2xl text-slate-600">Every pathway shares notes in the same system, so you can switch between walk-in, scheduled, and virtual care without repeating your story.</p>
          </div>
          <Link href="/contact" className="btn-primary">Talk to our team</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {accessOptions.map(option => {
            const isExternal = option.action.href.startsWith('http')
            return (
              <article key={option.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{option.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                {isExternal ? (
                  <a
                    href={option.action.href}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {option.action.label} →
                  </a>
                ) : (
                  <Link
                    href={option.action.href}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
                  >
                    {option.action.label} →
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="section-spacing">
        <div className="grid gap-6 md:grid-cols-3">
          {communityHighlights.map(highlight => (
            <article key={highlight.title} className="card h-full space-y-3">
              <span className="badge">{highlight.badge}</span>
              <h3 className="text-lg font-semibold text-slate-900">{highlight.title}</h3>
              <p className="text-sm text-slate-600">{highlight.copy}</p>
              {highlight.link && (
                <Link href={highlight.link.href} className="text-sm font-medium text-primary underline underline-offset-4">
                  {highlight.link.label}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="section-spacing text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-hover">
        <h2 className="mb-4 text-white">Ready to visit Mwein Medical?</h2>
        <p className="max-w-2xl mx-auto mb-6 text-slate-100">
          Call ahead or send your details online—we’ll confirm your appointment time, preparation steps, and insurance cover before you arrive.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary">Book online</Link>
          <a href="https://wa.me/254707711888" className="btn-outline bg-white text-primary">WhatsApp the clinic</a>
        </div>
      </section>
    </>
  )
}
