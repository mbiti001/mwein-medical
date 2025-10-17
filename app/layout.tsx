import '../styles/globals.css'
import { ReactNode } from 'react'
import Link from 'next/link'
import type { Metadata, Viewport } from 'next'
import Header from '../components/Header'
import DonationAttentionBanner from '../components/DonationAttentionBanner'
import DonationCelebration from '../components/DonationCelebration'
import { clinic, getSiteUrl } from '../lib/siteConfig'

const siteUrl = getSiteUrl()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: clinic.name,
    template: `%s | ${clinic.name}`
  },
  description: `${clinic.name} — ${clinic.tagline}`,
  keywords: [
    'clinic',
    'Busia County',
    'Kenya healthcare',
    '24 hour medical services',
    'Mungatsi clinic'
  ],
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: clinic.name,
    description: `${clinic.name} — ${clinic.tagline}`,
    siteName: clinic.name,
    locale: 'en_KE'
  },
  alternates: {
    canonical: siteUrl
  },
  twitter: {
    card: 'summary_large_image'
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <DonationAttentionBanner />
  <DonationCelebration />
        {/* JSON-LD LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MedicalClinic',
              '@id': `${siteUrl}#clinic`,
              name: clinic.name,
              image: [],
              url: siteUrl,
              telephone: clinic.phone,
              email: clinic.email,
              address: {
                '@type': 'PostalAddress',
                addressLocality: clinic.address.locality,
                addressRegion: clinic.address.region,
                addressCountry: clinic.address.country
              },
              paymentAccepted: 'M-Pesa',
              openingHours: [
                'Mo 00:00-23:59',
                'Tu 00:00-23:59',
                'We 00:00-23:59',
                'Th 00:00-23:59',
                'Fr 00:00-23:59',
                'Sa 00:00-23:59',
                'Su 00:00-23:59'
              ]
            })
          }}
        />
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="border-t py-8 mt-12 bg-slate-50">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold">Mwein Medical Services</h4>
              <p className="text-sm text-slate-600">Community clinic in Mungatsi, Busia County, Kenya</p>
              <p className="text-xs text-slate-500 mt-2">Open 24 hours · 7 days a week</p>
            </div>
            <div>
              <h4 className="font-semibold">Contact</h4>
              <p className="text-sm">Phone: <a href="tel:+254707711888" className="text-primary">+254707711888</a></p>
              <p className="text-sm">WhatsApp: <a href="https://wa.me/254707711888" className="text-primary">+254707711888</a></p>
              <p className="text-sm">Email: <a href="mailto:mweinmedical@gmail.com" className="text-primary">mweinmedical@gmail.com</a></p>
            </div>
            <div>
              <h4 className="font-semibold">Support & Links</h4>
              <p className="text-sm">Donate: <strong>M-Pesa Till 8121096</strong></p>
              <p className="text-sm">
                <Link href="/shop" className="text-primary">Shop</Link> ·{' '}
                <Link href="/donate" className="text-primary">Donate</Link> ·{' '}
                <Link href="/privacy" className="text-primary">Privacy</Link> ·{' '}
                <Link href="/terms" className="text-primary">Terms</Link>
              </p>
            </div>
          </div>
          <div className="container mx-auto px-4 text-sm text-center mt-6">© {new Date().getFullYear()} Mwein Medical Services</div>
        </footer>
      </body>
    </html>
  )
}
