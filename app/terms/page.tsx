import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Terms & conditions',
  description: 'Review the simple terms governing website use, clinic orders, and prescription-only services.',
  path: '/terms'
})

const lastUpdated = '18 October 2025'

export default function Terms() {
  return (
    <section className="space-y-10">
      <div className="card space-y-3 border-slate-200/80">
        <span className="badge w-max">Clinic website terms</span>
        <h1 className="text-3xl font-semibold">Using the Mwein Medical Services website</h1>
        <p className="text-slate-600">
          These terms govern use of our website, online shop, donation tools, and digital communication channels.
          When you contact us or place an order, you agree to the principles outlined below designed to keep patients and staff safe.
        </p>
        <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Appointments & clinical advice</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Online bookings are confirmed by our triage team; urgent cases should call or WhatsApp directly.</li>
            <li>• Digital advice is preliminary. Final diagnosis, prescriptions, and procedures require an in-person consult or telemedicine session with a licensed clinician.</li>
            <li>• Missed appointments without notice may incur a rebooking fee to cover clinician time.</li>
          </ul>
        </div>
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Shop & prescription items</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Over-the-counter items are supplied subject to stock availability and Ministry of Health regulations.</li>
            <li>• Prescription-only medicines require a valid prescription and may need an in-clinic review before release.</li>
            <li>• We may decline or adjust orders that conflict with safety guidelines or dispenser obligations.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Payments & donations</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Payments are accepted via M-Pesa Till 8121096, approved insurance panels (SHA, Yatta), or PayPal for international donors.</li>
            <li>• Receipts are issued upon request; donations may be earmarked for specific programs subject to clinic approval.</li>
            <li>• Refunds are considered on a case-by-case basis for double payments or cancelled services booked in advance.</li>
          </ul>
        </div>
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Communications & content</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• We communicate via phone, SMS, WhatsApp, or email using the contacts you provide.</li>
            <li>• Educational content on this site supplements—not replaces—consultation with qualified medical professionals.</li>
            <li>• External links are provided for convenience; Mwein Medical Services is not responsible for third-party content.</li>
          </ul>
        </div>
      </div>

      <div className="card space-y-3 border-primary/20 bg-primary/5">
        <h2 className="text-xl font-semibold text-primary">Questions about these terms?</h2>
        <p className="text-sm text-primary/80">
          Reach out via <a className="text-primary" href="mailto:mweinmedical@gmail.com">mweinmedical@gmail.com</a> or WhatsApp{' '}
          <a className="text-primary" href="https://wa.me/254707711888">+254 707 711 888</a>.
          We reserve the right to update these terms to reflect regulatory changes or new services; updates take effect when posted.
        </p>
      </div>
    </section>
  )
}
