import type { DefaultSeoProps } from 'next-seo'
import { clinic, getSiteUrl } from './lib/siteConfig'

const siteUrl = getSiteUrl()

const config: DefaultSeoProps = {
  title: clinic.name,
  description: `${clinic.name} — ${clinic.tagline}`,
  canonical: siteUrl,
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: siteUrl,
    siteName: clinic.name,
    title: clinic.name,
    description: `${clinic.name} — ${clinic.tagline}`
  },
  twitter: {
    cardType: 'summary_large_image'
  },
  additionalMetaTags: [
    {
      property: 'og:phone_number',
      content: clinic.phone
    },
    {
      name: 'theme-color',
      content: '#2563eb'
    }
  ]
}

export default config
