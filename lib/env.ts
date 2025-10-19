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

// Environment configuration
export const env = {
  // Core settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  DATABASE_PROVIDER: process.env.DATABASE_PROVIDER || 'sqlite',
  
  // Email
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  CONTACT_TO: process.env.CONTACT_TO || 'appointments@mweinmedical.co.ke',
  CONTACT_FROM: process.env.CONTACT_FROM || 'Mwein Medical <no-reply@mweinmedical.com>',
  
  // Admin
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || 'fallback-secret-for-development-only',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-nextauth-secret',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // Site
  SITE_URL: process.env.SITE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000',
    
  // Admin seeding
  ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL || 'admin@mweinmedical.co.ke',
  ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD || 'MweinAdmin123!',
  ADMIN_SEED_ROLE: process.env.ADMIN_SEED_ROLE || 'ADMIN',
  
  // Production safeguards
  ALLOW_SEED: process.env.ALLOW_SEED || 'false',
}

// Type-safe environment validation
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'ADMIN_SESSION_SECRET',
  ] as const
  
  const missing = required.filter(key => !env[key] || env[key] === '')
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:', missing)
    // Don't throw in build time, just warn
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.error('❌ Required environment variables missing in production')
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing
  }
}

export function requireAdminSessionSecret() {
  if (!env.ADMIN_SESSION_SECRET) {
    throw new Error('Missing required environment variable: ADMIN_SESSION_SECRET')
  }
  return env.ADMIN_SESSION_SECRET
}
