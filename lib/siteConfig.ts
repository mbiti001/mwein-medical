const DEFAULT_SITE_URL = 'https://mweinmedical.co.ke'

function normalizeUrl(candidate: string): string {
  const trimmed = candidate.trim()
  if (!trimmed) {
    return DEFAULT_SITE_URL
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/$/, '')
}

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL
  if (!fromEnv) {
    return DEFAULT_SITE_URL
  }

  try {
    const normalized = normalizeUrl(fromEnv)
    return new URL(normalized).origin
  } catch (error) {
    console.warn('Invalid site URL provided, falling back to default', error)
    return DEFAULT_SITE_URL
  }
}

export const clinic = {
  name: 'Mwein Medical Services',
  tagline: 'Exceptional care close to you, every hour of the day.',
  phone: '+254707711888',
  email: 'mweinmedical@gmail.com',
  address: {
    locality: 'Mungatsi',
    region: 'Busia County',
    country: 'Kenya'
  }
}
