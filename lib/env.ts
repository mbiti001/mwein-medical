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

const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL)
const databaseUrl = process.env.DATABASE_URL ?? FALLBACK_SQLITE_URL

function resolveMpesaCallbackUrl() {
  const explicit = process.env.MPESA_CALLBACK_URL
  if (explicit && explicit.startsWith('http')) {
    return explicit
  }
  const path = explicit && explicit.trim().length > 0 ? explicit.replace(/^\//, '') : 'api/donations/mpesa/callback'
  return `${siteUrl}/${path}`
}

function normalizeMpesaEnvironment(value: string | undefined | null) {
  if (!value) return 'sandbox' as const
  return value.toLowerCase() === 'production' ? 'production' : 'sandbox'
}

export const env = {
  siteUrl,
  databaseUrl,
  get databaseProvider() {
    return inferDatabaseProvider(databaseUrl)
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
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? null,
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY ?? '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? '',
    passkey: process.env.MPESA_PASSKEY ?? '',
    shortCode: process.env.MPESA_SHORT_CODE ?? '8121096',
    tillNumber: process.env.NEXT_PUBLIC_MPESA_TILL ?? process.env.MPESA_SHORT_CODE ?? '8121096',
    callbackUrl: resolveMpesaCallbackUrl(),
    environment: normalizeMpesaEnvironment(process.env.MPESA_ENVIRONMENT),
    callbackSecret: process.env.MPESA_CALLBACK_SECRET ?? ''
  }
}

export function requireAdminSessionSecret() {
  if (!env.adminSessionSecret) {
    throw new Error('Missing required environment variable: ADMIN_SESSION_SECRET')
  }
  return env.adminSessionSecret
}
