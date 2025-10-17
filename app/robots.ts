import type { MetadataRoute } from 'next'
import { getSiteUrl } from '../lib/siteConfig'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`
  }
}
