import Link from 'next/link'
import { buildPageMetadata } from '../../../lib/metadata'
import Phq9Assessment from '../../../components/Phq9Assessment'

const PAYMENT_OPTIONS = [
  {
    label: 'M-Pesa Till 8121096',
    details: 'Send KES 500 before the call. Add your name and “telehealth” in the reference so we can match the payment quickly.'
  },
  {
    label: 'PayPal (international supporters)',
    details: 'Use paypal.me/mweinmedical or send to mweinmedical@gmail.com. Quote the patient name and preferred consultation slot.'
  }
]

const PRE_VISIT_CHECKLIST = [
  'Reason for consultation and duration of current symptoms',
  'Relevant medical history (chronic conditions, past surgeries, pregnancies)',
  'Current medications, supplements, and over-the-counter drugs',
  'Known allergies (drug, food, environmental)',
  'Recent vitals where available (temperature, blood pressure, blood sugar, weight)',
  'Laboratory reports, imaging results, or discharge summaries to reference during the call',
  'Emergency contact and preferred pharmacy for any prescriptions'
]

const WHO_IS_ELIGIBLE = [
  'Stable follow-up visits for chronic illnesses such as hypertension, diabetes, asthma, or epilepsy',
  'Medication reviews, contraception counselling, and postnatal check-ins',
  'Acute concerns without red flags (e.g. mild infections) that can be triaged virtually before deciding on clinic visits',
  'Care coordination for patients travelling or studying away from Mungatsi who need continuity with the Mwein team'
]

export const metadata = buildPageMetadata({
  title: 'Telehealth consultations',
  description: 'Secure telehealth visits with Mwein clinicians including mobile payment options, pre-visit checklist, and follow-up expectations.',
  path: '/services/telehealth'
})

export default function TelehealthService() {
  return (
    <div className="space-y-16">
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-sky-50 via-white to-slate-50 border border-slate-100">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-4">
            <span className="badge">Telehealth</span>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Consult a clinician from anywhere in Kenya</h1>
            <p className="text-slate-600">
              Mwein Medical Services provides 25-minute virtual consultations for established patients and approved referrals. Each session
              includes a structured review, shared care plan, and digital prescription where appropriate. We triage urgent symptoms to in-person
              care and coordinate referrals when needed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Request a telehealth slot</Link>
              <a href="https://wa.me/254707711888" className="btn-outline">WhatsApp care coordination</a>
            </div>
            <p className="text-sm text-slate-500">
              Telehealth operates daily between <strong>07:00 and 21:00 EAT</strong>. For overnight emergencies, call immediately—our on-call clinician will guide next steps.
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Consultation payment</h2>
            <p className="text-sm text-slate-600">
              Virtual visits are billed at <strong>KES 500</strong> per session. Once payment reflects, we confirm your slot and send the secure video or phone meeting link.
            </p>
            <ul className="space-y-3 text-sm text-slate-600">
              {PAYMENT_OPTIONS.map(option => (
                <li key={option.label} className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                  <p className="font-medium text-primary">{option.label}</p>
                  <p className="text-primary/80">{option.details}</p>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              Share the transaction reference via WhatsApp or email so we can attach the receipt to your consultation notes.
            </p>
          </div>
        </div>
      </section>

      <section className="section-spacing rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold text-slate-900">What to prepare before your telehealth visit</h2>
            <p className="text-slate-600">
              Thorough information helps our clinicians make safe decisions remotely. Please gather the following details ahead of time and send
              them through the appointment form or a secure message to the care team.
            </p>
            <ul className="space-y-3 text-sm text-slate-600">
              {PRE_VISIT_CHECKLIST.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-xs">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card space-y-4 border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">During and after the call</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>• Keep your phone charged with a reliable network connection and join five minutes early for audio/video checks.</li>
              <li>• A guardian must be present for children or dependent adults to provide consent and assist with examination manoeuvres.</li>
              <li>• Clinicians may ask you to capture vital signs or share photos—use good lighting and avoid filters.</li>
              <li>• You will receive follow-up notes, prescriptions, or lab/imaging requests via email or WhatsApp within 30 minutes of the session.</li>
              <li>• If the clinician detects red flags, they will arrange an in-person review or coordinate emergency transfer immediately.</li>
            </ul>
            <p className="text-xs text-slate-500">
              Need a summary for school or work? Request it at the end of the call and we will issue a signed memo once clinically appropriate.
            </p>
          </div>
        </div>
      </section>

      <section className="section-spacing rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold text-slate-900">Mental health check-in (PQ-9 / PHQ-9)</h2>
            <p className="text-slate-600">
              Emotional wellbeing is part of every telehealth review. Complete the PQ-9 (also known as PHQ-9) questionnaire below and share the score with your clinician
              before the call. It helps us gauge symptom severity, track progress, and decide if urgent in-person care is needed.
            </p>
            <p className="text-sm text-slate-500">
              If any answer scores <strong>2</strong> or more on question 9 (thoughts of self-harm), contact the clinic immediately via phone or WhatsApp so we can fast-track
              support and safety planning.
            </p>
            <div className="text-sm text-slate-500 flex flex-wrap gap-3">
              <span className="badge bg-primary/10 text-primary">Share score securely</span>
              <span className="badge bg-slate-100 text-slate-700">Takes ~3 minutes</span>
            </div>
          </div>
          <div className="card border-slate-200 bg-slate-50">
            <Phq9Assessment />
          </div>
        </div>
      </section>

      <section className="section-spacing rounded-3xl bg-gradient-to-r from-primary/90 via-primary to-sky-500 text-white">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Who is telehealth best suited for?</h2>
            <p className="text-white/85">Virtual care keeps you connected to your Mwein clinician even when travel is difficult. We remain vigilant about safety and will guide you to the right care setting.</p>
            <ul className="space-y-3 text-sm text-white/90">
              {WHO_IS_ELIGIBLE.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-white/60">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-white text-slate-900 space-y-5 border-none shadow-2xl">
            <h3 className="text-xl font-semibold">Quick telehealth flow</h3>
            <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
              <li>Submit the appointment form or WhatsApp the clinic with your preferred time and the details above.</li>
              <li>Complete payment via M-Pesa or PayPal and share the confirmation reference.</li>
              <li>Receive a secure link plus clinician assignment once the team reviews your history.</li>
              <li>Join the call with your documents. The clinician documents the session and sends your care plan.</li>
              <li>Need medication delivery or lab follow-up? We will coordinate courier options or an in-person visit.</li>
            </ol>
            <p className="text-xs text-slate-500">
              Telehealth sessions are documented in the same clinical record as in-person visits and follow the Kenya Data Protection Act.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Book telehealth now</Link>
              <a href="mailto:mweinmedical@gmail.com" className="btn-outline">Email the care team</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
