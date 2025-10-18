export type ServiceLine = {
  id: string
  name: string
  tagline: string
  summary: string
  href: string
  highlights: string[]
  offerings: Array<{
    title: string
    description: string
  }>
  links: Array<{
    label: string
    href: string
  }>
}

export const serviceLines: ServiceLine[] = [
  {
    id: 'primary-care',
    name: 'Primary & Chronic Care',
    tagline: '24/7 walk-ins with family doctors, nurses, and visiting specialists.',
    summary:
      'From urgent triage to long-term condition management, the outpatient wing keeps families on track with seamless lab, pharmacy, and follow-up support.',
    href: '/services/outpatient',
    highlights: [
      'Same-day consults for acute symptoms and injuries',
      'Dedicated hypertension, diabetes, asthma, and sickle cell clinics',
      'Medication reviews with on-site pharmacy counselling'
    ],
    offerings: [
      {
        title: 'Walk-in stabilisation',
        description: 'Rapid triage, IV therapy, oxygen, and transfer coordination when higher-level care is required.'
      },
      {
        title: 'Preventive screenings',
        description: 'Blood pressure, cervical and breast screening, men’s wellness checks, and chronic condition monitoring.'
      },
      {
        title: 'Family planning services',
        description: 'Implants, IUCDs, injectables, and counselling with same-day procedures and follow-up reminders.'
      }
    ],
    links: [
      { label: 'Outpatient visit flow', href: '/services/outpatient' },
      { label: 'Minor procedures list', href: '/services/minor-procedures' }
    ]
  },
  {
    id: 'maternal-child',
    name: 'Maternal & Child Health',
    tagline: 'Continuity for pregnancy journeys, newborn care, and growing families.',
    summary:
      'Midwives, nurses, and paediatric clinicians coordinate antenatal reviews, safe delivery planning, immunisation schedules, and nutrition support in one place.',
    href: '/services/antenatal',
    highlights: [
      'Respectful maternity care with emergency referral pathways',
      'Routine and high-risk antenatal monitoring with bedside ultrasound',
      'Child wellness clinics, KEPI immunisations, and growth tracking'
    ],
    offerings: [
      {
        title: 'Antenatal & postnatal visits',
        description: 'Birth planning, foetal heart checks, expanded labs, and caregiver coaching before and after delivery.'
      },
      {
        title: 'Newborn & child reviews',
        description: 'Fever assessments, nutrition consults, developmental screening, and sick visit management.'
      },
      {
        title: 'Family support services',
        description: 'Breastfeeding guidance, family planning integration, and psychosocial check-ins for caregivers.'
      }
    ],
    links: [
      { label: 'Antenatal care overview', href: '/services/antenatal' },
      { label: 'Child wellness clinics', href: '/services/child-wellness' }
    ]
  },
  {
    id: 'diagnostics-procedures',
    name: 'Diagnostics & Procedures',
    tagline: 'Laboratory, ultrasound, and minor theatre ready around the clock.',
    summary:
      'On-site technologists deliver rapid results while clinicians perform bedside procedures so most patients complete care in a single visit.',
    href: '/services/laboratory',
    highlights: [
      'Rapid malaria, HIV, chemistry, and haemogram panels in minutes',
      'Obstetric, abdominal, and pelvic ultrasound with printed or digital reports',
      'Minor surgery suite for wound care, abscess drainage, and elective procedures'
    ],
    offerings: [
      {
        title: 'Laboratory diagnostics',
        description: 'Comprehensive testing menus with electronic reporting and courier partnerships for specialised panels.'
      },
      {
        title: 'Imaging services',
        description: 'Ultrasound guided by clinicians plus partner X-ray centres with coordinated referrals when needed.'
      },
      {
        title: 'Procedure theatre',
        description: 'Suturing, keloid revision, circumcision, and other day procedures with sterile monitoring and aftercare.'
      }
    ],
    links: [
      { label: 'Laboratory capabilities', href: '/services/laboratory' },
      { label: 'Ultrasound services', href: '/services/ultrasound' },
      { label: 'Minor procedures', href: '/services/minor-procedures' }
    ]
  },
  {
    id: 'virtual-support',
    name: 'Telehealth & Community Support',
    tagline: 'Remote consults, medication refills, and outreach that keeps care within reach.',
    summary:
      'Clinicians follow up virtually, coordinate home visits, and connect families to pharmacy refills or donor-funded support programmes.',
    href: '/services/telehealth',
    highlights: [
      'Same-day virtual reviews with secure medication handover',
      'Home visits scheduled for patients needing bedside monitoring',
      'Community outreach, referrals, and donor coordination'
    ],
    offerings: [
      {
        title: 'Telehealth consults',
        description: 'Video or phone reviews with symptom triage, digital prescriptions, and lab requisitions sent instantly.'
      },
      {
        title: 'Medication & device delivery',
        description: 'Pharmacy packs, chronic medicines, and monitoring equipment arranged for pick-up or courier drop-offs.'
      },
      {
        title: 'Outreach programmes',
        description: 'Cancer screening drives, mental health check-ins, and chronic disease education in surrounding communities.'
      }
    ],
    links: [
      { label: 'Telehealth workflow', href: '/services/telehealth' },
      { label: 'Mental health assistant', href: '/mental-health' },
      { label: 'Cancer screening guide', href: '/cancer-screening' }
    ]
  }
]
