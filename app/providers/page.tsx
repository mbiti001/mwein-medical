import { buildPageMetadata } from '../../lib/metadata'

const providerProfiles = [
  {
    name: 'Dr. Mercy Wanyama, MBChB',
    title: 'Medical Director · Family Physician',
    bio: 'Leads clinical governance, chronic disease programs, and community outreach for maternal and child health.',
    highlights: ['15+ years in family medicine', 'NHIF/SHA panel doctor', 'Certified in ultrasound basics'],
    availability: 'Mon–Sat · 8:00 am – 6:00 pm'
  },
  {
    name: 'Dr. Brian Kibe, MMed',
    title: 'Consulting Physician · Internal Medicine',
    bio: 'Oversees specialist clinics for hypertension, diabetes, and heart disease with monthly in-person sessions.',
    highlights: ['Fellow, College of Physicians of East Africa', 'Teleconsult support between visits', 'Coordinates tertiary referrals'],
    availability: 'Special clinics · Every 2nd & 4th Friday'
  },
  {
    name: 'Sr. Alice Amukoya, KRCHN',
    title: 'Senior Registered Nurse · Antenatal & Child Wellness',
    bio: 'Guides ANC journeys, newborn assessments, immunizations, and family planning education for mothers and caregivers.',
    highlights: ['Lamaze-certified childbirth educator', 'KEPI immunization trainer', 'Leads breastfeeding support groups'],
    availability: 'Mon–Sat · 7:30 am – 5:30 pm'
  },
  {
    name: 'Sr. Peter Ouma, KRPN',
    title: 'Clinical Officer · Emergency & Minor Procedures',
    bio: 'Manages urgent walk-ins, wound care, circumcision program, and coordinates ambulance transfers when required.',
    highlights: ['ATLS & ACLS certified', 'Trainer for community first responders', 'Leads evening telehealth triage'],
    availability: 'Daily · 10:00 am – 10:00 pm'
  },
]

export const metadata = buildPageMetadata({
  title: 'Our providers',
  description: 'Get to know the multidisciplinary team delivering 24/7 care at Mwein Medical Services.',
  path: '/providers'
})

export default function Providers() {
  return (
    <>
      <section className="section-spacing rounded-3xl bg-gradient-to-r from-white via-slate-50 to-sky-50 shadow-inset mb-12">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <span className="badge mb-4">Clinical Team</span>
            <h1>Meet the clinicians behind Mwein Medical</h1>
            <p>
              Experienced doctors, nurses, and clinical officers partner closely so every patient receives coordinated, compassionate care.
              We invest in continuous training and telehealth coverage to keep support within reach day and night.
            </p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Multidisciplinary team with specialists visiting twice monthly</li>
              <li>• Continuous medical education and mentorship for emerging clinicians</li>
              <li>• 24/7 emergency coordination across Busia County facilities</li>
            </ul>
          </div>
          <div>
            <div className="card space-y-3">
              <h3 className="mb-1">Building trust with every visit</h3>
              <p className="text-sm text-slate-600">
                Patient navigators ensure new families feel welcome, and chronic care coaches follow up between appointments to keep treatment plans on track.
              </p>
              <p className="text-xs text-slate-500">Need to consult a specific specialist? Call <a href="tel:+254707711888" className="text-primary">+254707711888</a> and we&rsquo;ll schedule the next available session.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="mb-2">Our core care team</h2>
            <p className="text-slate-600 max-w-2xl">Explore the clinicians you can meet on-site. Each profile includes service focus, experience highlights, and availability.</p>
          </div>
          <a href="https://wa.me/254707711888" className="btn-outline">Request appointment</a>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {providerProfiles.map(provider => (
            <article key={provider.name} className="card space-y-4">
              <header>
                <h3 className="text-xl font-semibold mb-1">{provider.name}</h3>
                <p className="text-sm text-slate-500">{provider.title}</p>
              </header>
              <p className="text-sm text-slate-600">{provider.bio}</p>
              <ul className="text-sm text-slate-500 space-y-1">
                {provider.highlights.map(item => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <div className="text-sm font-semibold text-primary">{provider.availability}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-spacing bg-surface rounded-3xl border border-slate-100 p-8 md:p-12 mb-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2>Continuity of care matters</h2>
            <p className="text-slate-600">We pair each patient with a lead clinician so follow-ups feel seamless, even when visiting specialists rotate in. Our electronic records and secure messaging keep everyone aligned.</p>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Shared treatment plans across departments</li>
              <li>• Telehealth check-ins for chronic patients between visits</li>
              <li>• Pharmacy counselling synced with clinician recommendations</li>
            </ul>
          </div>
          <div className="card space-y-4">
            <h3 className="mb-1">Your care concierge</h3>
            <p className="text-sm text-slate-600">Our front-office team coordinates referrals, insurance pre-authorizations, and transportation for expectant mothers or emergency transfers.</p>
            <p className="text-sm text-slate-500">Need help now? Call <a href="tel:+254707711888" className="text-primary">+254707711888</a> or email <a href="mailto:mweinmedical@gmail.com" className="text-primary">mweinmedical@gmail.com</a>.</p>
          </div>
        </div>
      </section>

      <section className="section-spacing text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-3xl shadow-hover">
        <h2 className="mb-3 text-white">Join or collaborate with our team</h2>
        <p className="max-w-2xl mx-auto mb-6 text-slate-100">
          We welcome visiting consultants, locum clinicians, and trainees who share our passion for community-centered care. Reach out and we&rsquo;ll connect you with the medical director.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="mailto:mweinmedical@gmail.com?subject=Clinical%20collaboration&body=Hi%20Mwein%20Medical%2C" className="btn-primary">Introduce yourself</a>
          <a href="https://wa.me/254707711888" className="btn-outline bg-white text-primary">WhatsApp the director</a>
        </div>
      </section>
    </>
  )
}
