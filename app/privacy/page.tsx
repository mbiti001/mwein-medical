import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Privacy policy',
  description: 'Understand how Mwein Medical Services safeguards patient information and contact details.',
  path: '/privacy'
})

export default function Privacy() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-3">Privacy Policy</h2>
      <p className="mb-4">We respect your privacy. We only collect the minimum contact information necessary to respond to enquiries or process orders. We avoid storing personal health information; if you provide symptoms, these are used only to direct care and are not stored long-term.</p>
      <h3 className="text-lg font-semibold mt-4">Kenya Data Protection</h3>
      <p className="mb-2">We follow best practices aligned with the Kenya Data Protection Act, 2019: purpose limitation, data minimization, and secure handling of personal data.</p>
    </section>
  )
}
