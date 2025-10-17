import type { MetadataRoute } from 'next'
import { getSiteUrl } from '../lib/siteConfig'

const routes = ['/', '/about', '/services', '/providers', '/shop', '/cart', '/contact', '/donate', '/privacy', '/terms']

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  return routes.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified
  }))
}
