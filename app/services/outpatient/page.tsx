import Link from 'next/link'
import { buildPageMetadata } from '../../../lib/metadata'

const visitOptions = [
  {
    title: 'Same-day primary care consults',
    description:
      'Walk in 24/7 for acute illnesses, injuries, routine exams, blood pressure checks, and immediate triage for urgent cases.'
  },
  {
    title: 'Chronic disease reviews',
    description:
      'Dedicated clinics for hypertension, diabetes, asthma, epilepsy, and sickle cell with medication adjustments and lifestyle support.'
  },
  {
    title: 'Maternal health visits',
    description:
      'Antenatal and postnatal reviews, respectful maternity care, and family planning counselling plus procedures (implants, IUCDs, injectables).'
  },
  {
    title: 'Paediatric sick & wellness clinics',
    description:
      'Growth monitoring, fever assessments, immunization catch-up, and nutrition coaching for babies, children, and adolescents.'
  },
  {
    title: 'Women’s health screenings',
    description:
      'Cervical cancer screening (VIA/VILI), breast exams, menstrual health consultations, and fertility planning.'
  },
  {
    title: 'Men’s health consults',
    description:
      'Lifestyle and risk assessments, prostate health conversations, and STI screening with discreet treatment plans.'
  },
  {
    title: 'Minor procedures',
    description:
      'Wound suturing, abscess drainage, keloid management, circumcision, and foreign body removal with on-site monitoring.'
  },
  {
    title: 'Point-of-care diagnostics',
    description:
      'Rapid malaria, pregnancy, HIV, haemogram, chemistry panels, ECGs, and other lab workups while you wait.'
  },
  {
    title: 'Ultrasound access',
    description:
      'Obstetric dating and wellbeing scans, abdominal and pelvic ultrasounds with clinician interpretation and referrals when needed.'
  },
  {
    title: 'Pharmacy counselling',
    description:
      'Clinician-to-pharmacist handoff with adherence coaching, medication therapy management, and stock for emergency scripts.'
  },
  {
    title: 'Urgent referral coordination',
    description:
      'Stabilization, ambulance linkage, and detailed transfer notes to partner facilities when higher-level care is required.'
  },
  {
    title: 'Telehealth & home visit follow-up',
    description:
      'Secure video or phone check-ins after discharge and scheduled clinician home rounds for patients who need bedside reviews.'
  }
]

const preparationTips = [
  'Carry any previous clinic books, lab results, or imaging reports—this helps our clinicians tailor your plan faster.',
  'Arrive 10 minutes early for triage; vitals and weight are checked at every visit.',
  'Bring your insurance card or payment method (we accept SHA, Yatta, mobile money, and cash).',
  'For fasting labs, have only water for 8 hours before arrival unless your clinician advises otherwise.',
  'Children should come with their caregiver or consent note for treatment.'
]

export const metadata = buildPageMetadata({
  title: 'Outpatient visits',
  description: 'Primary care, chronic clinics, maternal health, screenings, and diagnostics available 24/7 at Mwein Medical Services.',
  path: '/services/outpatient'
})

export default function OutpatientCare() {
  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-br from-white via-sky-50 to-slate-100 shadow-inset mb-12">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-5">
            <span className="badge">Outpatient department</span>
            <h1 className="max-w-2xl">Everyday care without the wait</h1>
            <p className="text-lg text-slate-600 max-w-3xl">
              Walk in anytime—our clinicians triage urgent cases, manage chronic conditions, and keep families on track with preventive care.
              On-site lab, pharmacy, and ultrasound mean most visits are completed in a single stop.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Book an appointment</Link>
              <a href="tel:+254707711888" className="btn-outline">Call +254 707 711 888</a>
            </div>
            <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">24/7 walk-ins and emergency cover</li>
              <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">SHA &amp; Yatta insurance accepted</li>
              <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">Electronic prescriptions &amp; lab results</li>
              <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">Partner ambulances for referrals</li>
            </ul>
          </div>
          <div className="card space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Visit snapshot</h3>
              <p className="text-sm text-slate-600">
                Intake nurses record vitals, flag emergencies, and escalate to clinicians while diagnostics and pharmacy coordinate in parallel.
              </p>
            </div>
            <dl className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                <dt className="text-xs uppercase tracking-wide text-primary">Typical duration</dt>
                <dd>45–90 minutes if lab work is needed.</dd>
              </div>
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                <dt className="text-xs uppercase tracking-wide text-primary">Clinician roster</dt>
                <dd>Family doctors, nurses, midwives, and visiting specialists.</dd>
              </div>
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                <dt className="text-xs uppercase tracking-wide text-primary">After-hours cover</dt>
                <dd>On-call clinician + emergency triage nurse every night.</dd>
              </div>
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                <dt className="text-xs uppercase tracking-wide text-primary">Follow-up</dt>
                <dd>Telehealth or in-person review scheduled before discharge.</dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500">Need us to coordinate transport? Call ahead and we’ll line up a partner ambulance.</p>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="mb-2">What we handle during outpatient visits</h2>
            <p className="max-w-2xl text-slate-600">From preventive screens to urgent stabilization, the outpatient wing is equipped to manage the full spectrum of family care.</p>
          </div>
          <Link href="/services/minor-procedures" className="btn-outline">View minor procedures</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {visitOptions.map(option => (
            <div key={option.title} className="card space-y-3 border border-slate-100 bg-white shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{option.title}</h3>
              <p className="text-sm text-slate-600">{option.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-spacing rounded-3xl bg-surface border border-slate-100 p-8 md:p-12 mb-12">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <h2>Preparing for your visit</h2>
            <p className="text-slate-600">A little preparation goes a long way. Arrive with your records and let the front desk know if you have mobility needs—we’ll make the visit as smooth as possible.</p>
            <ul className="space-y-3 text-sm text-slate-600">
              {preparationTips.map(tip => (
                <li key={tip} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Need a reminder?</h3>
              <p className="text-sm text-slate-600">We’ll send follow-up instructions via SMS or WhatsApp, including prescriptions, lab schedules, and next steps.</p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-sm text-slate-700 space-y-3">
              <p className="font-semibold text-primary">Insurance & payment</p>
              <p>We accept SHA and Yatta plans, mobile money (M-Pesa), cash, and bank transfers. Corporate billing is available for partner employers.</p>
              <p className="font-semibold text-primary">Need extra privacy?</p>
              <p>Ask the reception team for a private consultation room or a discrete waiting area—we’ll accommodate without delay.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Reserve a slot</Link>
              <a href="https://wa.me/254707711888" className="btn-outline">WhatsApp triage nurse</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-hover">
        <h2 className="mb-4 text-white">Ready for your first visit?</h2>
        <p className="mx-auto mb-6 max-w-2xl text-slate-100">
          Call ahead or send your details—we’ll confirm appointment time, preparation steps, and insurance cover before you arrive.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary">Book online</Link>
          <a href="tel:+254707711888" className="btn-outline bg-white text-primary">Call +254 707 711 888</a>
        </div>
      </section>
    </>
  )
}
