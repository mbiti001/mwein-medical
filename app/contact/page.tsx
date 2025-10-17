import ContactForm from '../../components/ContactForm'
import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Contact & bookings',
  description: 'Reach the Mwein Medical Services team 24/7 by phone, WhatsApp, or appointment form.',
  path: '/contact'
})

export default function Contact() {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-4">Contact us</h2>
      <p className="mb-3">
        Call <a href="tel:+254707711888" className="text-primary">+254707711888</a> or WhatsApp
        {' '}
        <a href="https://wa.me/254707711888" className="text-primary">+254707711888</a>
        {' '}anytime — our team monitors lines 24/7.
      </p>
      <ContactForm />
    </section>
  )
}
