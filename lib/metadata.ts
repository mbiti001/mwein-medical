import type { Metadata } from 'next'
import { clinic, getSiteUrl } from './siteConfig'

const siteUrl = getSiteUrl()

export type PageMetadataOptions = {
  title: string
  description?: string
  path?: string
}

export function buildPageMetadata({ title, description, path }: PageMetadataOptions): Metadata {
  const resolvedDescription = description ?? `${clinic.name} — ${clinic.tagline}`
  const canonical = path ? new URL(path, siteUrl).toString() : siteUrl

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url: canonical,
      type: 'website',
      siteName: clinic.name,
      locale: 'en_KE'
    }
  }
}
