import { SignJWT, jwtVerify } from 'jose'

export const ADMIN_SESSION_COOKIE = 'admin_session'
export const DEFAULT_SESSION_TTL = 60 * 60 * 6 // 6 hours

export type AdminRole = 'ADMIN' | 'PHARMACY' | 'CLINIC'

const ADMIN_ROLES: readonly AdminRole[] = ['ADMIN', 'PHARMACY', 'CLINIC'] as const

export function normaliseAdminRole(input: string | null | undefined): AdminRole {
  if (!input) return 'PHARMACY'
  const candidate = input.toUpperCase()
  if (ADMIN_ROLES.includes(candidate as AdminRole)) {
    return candidate as AdminRole
  }
  return 'PHARMACY'
}

const ISSUER = 'mwein-medical'
const AUDIENCE = 'admin'

export type SessionPayload = {
  userId: string
  email: string
  role: AdminRole
  issuedAt: number
  expiresAt: number
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getSecretKey() {
  return new TextEncoder().encode(getRequiredEnv('ADMIN_SESSION_SECRET'))
}

export async function createAdminSessionToken(payload: { userId: string; email: string; role: AdminRole }, ttlSeconds: number = DEFAULT_SESSION_TTL) {
  const secret = getSecretKey()
  const role = normaliseAdminRole(payload.role)
  const jwt = await new SignJWT({ email: payload.email, role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret)

  return jwt
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const secret = getSecretKey()
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE
    })

    if (typeof payload.sub !== 'string') {
      return null
    }

    if (typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null
    }

    const issuedAt = typeof payload.iat === 'number' ? payload.iat : Math.floor(Date.now() / 1000)
    const expiresAt = typeof payload.exp === 'number' ? payload.exp : issuedAt + DEFAULT_SESSION_TTL

    return {
      userId: payload.sub,
      email: payload.email,
      role: normaliseAdminRole(payload.role),
      issuedAt,
      expiresAt
    }
  } catch (error) {
    console.error('Failed to verify admin session token', error)
    return null
  }
}

export function signOutCookieValue() {
  return ''
}
