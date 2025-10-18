import crypto from 'crypto'

export const ADMIN_SESSION_COOKIE = 'mwein_admin_session'
export const DEFAULT_SESSION_TTL = 60 * 60 * 6 // 6 hours

export type AdminRole = 'ADMIN' | 'PHARMACY' | 'CLINIC'

export const ADMIN_ROLES: readonly AdminRole[] = ['ADMIN', 'PHARMACY', 'CLINIC'] as const

export function normaliseAdminRole(input: string | null | undefined): AdminRole {
  if (!input) return 'PHARMACY'
  const candidate = input.toUpperCase()
  if (ADMIN_ROLES.includes(candidate as AdminRole)) {
    return candidate as AdminRole
  }
  return 'PHARMACY'
}

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

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(token: string): SessionPayload | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8')
    const parsed = JSON.parse(json) as Partial<SessionPayload>
    if (
      typeof parsed?.userId !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.role !== 'string' ||
      typeof parsed.issuedAt !== 'number' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null
    }
    return parsed as SessionPayload
  } catch {
    return null
  }
}

function sign(value: string) {
  const secret = getRequiredEnv('ADMIN_SESSION_SECRET')
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

export function createAdminSessionToken(payload: { userId: string; email: string; role: AdminRole }, ttlSeconds: number = DEFAULT_SESSION_TTL) {
  const now = Math.floor(Date.now() / 1000)
  const toEncode: SessionPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    issuedAt: now,
    expiresAt: now + ttlSeconds
  }
  const encoded = encodePayload(toEncode)
  const signature = sign(encoded)
  return `${encoded}.${signature}`
}

export function verifyAdminSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encoded, signature] = parts
  const expectedSignature = sign(encoded)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (actualBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null
  }

  const payload = decodePayload(encoded)
  if (!payload) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.expiresAt < now) {
    return null
  }

  return payload
}

export function signOutCookieValue() {
  return ''
}
