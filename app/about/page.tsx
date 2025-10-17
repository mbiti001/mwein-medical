import { buildPageMetadata } from '../../lib/metadata'

export const metadata = buildPageMetadata({
  title: 'About the clinic',
  description: 'Meet the team and mission driving 24/7 compassionate care at Mwein Medical Services in Mungatsi.',
  path: '/about'
})

export default function About() {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-4">About Mwein Medical Services</h2>
      <p className="mb-4">Mwein Medical Services is a community clinic serving families in Mungatsi and surrounding areas. We provide respectful, confidential care that focuses on prevention and practical support.</p>
      <h3 className="text-xl font-semibold mt-6">Mission</h3>
      <p>To provide accessible, high-quality primary care and essential services that keep families healthy close to home.</p>
  <h3 className="text-xl font-semibold mt-6">Hours & Location</h3>
  <p className="mb-1">Open 24 hours · 7 days a week</p>
  <p>Mungatsi, Busia County, Kenya</p>
    </section>
  )
}
