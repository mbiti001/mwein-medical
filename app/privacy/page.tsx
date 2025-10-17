import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Privacy policy',
  description: 'Understand how Mwein Medical Services safeguards patient information and contact details.',
  path: '/privacy'
})

const lastUpdated = '18 October 2025'

export default function Privacy() {
  return (
    <section className="space-y-10">
      <div className="card space-y-3 border-primary/30 bg-white">
        <span className="badge w-max">Privacy statement</span>
        <h1 className="text-3xl font-semibold">How we protect your information</h1>
        <p className="text-slate-600">
          Mwein Medical Services collects only the details required to respond to enquiries, process donations and shop orders, or coordinate care.
          We align our practices with the Kenya Data Protection Act (2019) and Ministry of Health guidance for handling sensitive health information.
        </p>
        <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Data we collect</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Contact details (name, phone number, email, WhatsApp) shared via the booking, donate, or contact forms.</li>
            <li>• Appointment preferences, symptoms, or family planning needs provided to help triage your request.</li>
            <li>• Donation confirmations (M-Pesa or PayPal receipts) when you request acknowledgements or statements.</li>
            <li>• Order details for clinic shop purchases, including delivery instructions and payment confirmation.</li>
          </ul>
        </div>
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">How we use your data</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• To respond to medical enquiries, schedule appointments, or provide clinical follow-up.</li>
            <li>• To process payments, issue receipts, and comply with Kenya Revenue Authority requirements.</li>
            <li>• To coordinate referrals or emergency transport when you or a dependant needs urgent care.</li>
            <li>• To share clinic updates with your consent. You may opt out of SMS/WhatsApp/email updates anytime.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Retention & security</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Contact records are retained for up to 24 months unless you request deletion sooner.</li>
            <li>• Clinical notes are stored in secure, access-controlled systems as required by Kenyan health regulations.</li>
            <li>• Payment confirmations are stored for statutory accounting periods (minimum 7 years).</li>
            <li>• All staff handling personal data sign confidentiality agreements and receive data protection training.</li>
          </ul>
        </div>
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Your rights & choices</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Request access to, correction of, or deletion of your personal data.</li>
            <li>• Withdraw consent for marketing or fundraising communications at any time.</li>
            <li>• Request a copy of our Data Protection Impact Assessment for new digital services.</li>
            <li>• Escalate concerns to the Office of the Data Protection Commissioner if you feel your rights are infringed.</li>
          </ul>
        </div>
      </div>

      <div className="card space-y-3 border-primary/20 bg-primary/5">
        <h2 className="text-xl font-semibold text-primary">Contact our Data Officer</h2>
        <p className="text-sm text-primary/80">
          Email <a className="text-primary" href="mailto:mweinmedical@gmail.com">mweinmedical@gmail.com</a> or WhatsApp{' '}
          <a className="text-primary" href="https://wa.me/254707711888">+254 707 711 888</a> for privacy requests.
          We respond within two business days and will guide you through any verification required.
        </p>
      </div>
    </section>
  )
}
