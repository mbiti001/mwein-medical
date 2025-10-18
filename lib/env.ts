const FALLBACK_SITE_URL = 'https://mweinmed.com'
const FALLBACK_SQLITE_URL = 'file:./prisma/dev.db'

function normalizeSiteUrl(input: string | undefined | null) {
  if (!input) return FALLBACK_SITE_URL
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`)
    url.pathname = '/' // ensure trailing slash trimmed
    return url.origin
  } catch {
    return FALLBACK_SITE_URL
  }
}

function inferDatabaseProvider(databaseUrl: string) {
  return databaseUrl.startsWith('file:') ? 'sqlite' : 'postgresql'
}

export const env = {
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL),
  databaseUrl: process.env.DATABASE_URL ?? FALLBACK_SQLITE_URL,
  get databaseProvider() {
    return inferDatabaseProvider(env.databaseUrl)
  },
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? '',
    to: process.env.CONTACT_EMAIL ?? ''
  },
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? null
}

export function requireAdminSessionSecret() {
  if (!env.adminSessionSecret) {
    throw new Error('Missing required environment variable: ADMIN_SESSION_SECRET')
  }
  return env.adminSessionSecret
}
