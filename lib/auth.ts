import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { compare, hash } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { prisma } from './prisma'

export const ADMIN_SESSION_COOKIE = 'admin_session'
export const DEFAULT_SESSION_TTL = 60 * 60 * 6 // 6 hours

export type AdminRole = 'ADMIN' | 'PHARMACY' | 'CLINIC'

const ADMIN_ROLES: readonly AdminRole[] = ['ADMIN', 'PHARMACY', 'CLINIC'] as const

export function normaliseAdminRole(input?: string | null): AdminRole {
  if (!input) return 'PHARMACY'
  const candidate = input.toUpperCase()
  if ((ADMIN_ROLES as readonly string[]).includes(candidate)) return candidate as AdminRole
  return 'PHARMACY'
}

export type SessionPayload = {
  userId: string
  email?: string
  role: AdminRole
  issuedAt: number
  expiresAt: number
}

const SECRET = process.env.ADMIN_SESSION_SECRET || ''
const EXPIRY = 6 * 60 * 60 // 6 hours in seconds

export async function hashPassword(password: string) {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashed: string) {
  return compare(password, hashed)
}

export function createSession(userId: string, role: AdminRole, email?: string) {
  if (!SECRET) {
    console.error('ADMIN_SESSION_SECRET is not set; skipping session creation')
    return
  }
  const token = sign({ userId, email, role }, SECRET, { expiresIn: EXPIRY })
  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: EXPIRY,
  })
}

export function getSession() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  if (!SECRET) return null
  try {
    const payload = verify(token, SECRET) as SessionPayload & { iat?: number; exp?: number }
    const issuedAt = typeof payload.iat === 'number' ? payload.iat : Math.floor(Date.now() / 1000)
    const expiresAt = typeof payload.exp === 'number' ? payload.exp : issuedAt + DEFAULT_SESSION_TTL
    return {
      userId: payload.userId as string,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: normaliseAdminRole(payload.role) as AdminRole,
      issuedAt,
      expiresAt,
    } as SessionPayload
  } catch {
    return null
  }
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  if (!SECRET) return null
  try {
    const payload = verify(token, SECRET) as SessionPayload & { iat?: number; exp?: number }
    const issuedAt = typeof payload.iat === 'number' ? payload.iat : Math.floor(Date.now() / 1000)
    const expiresAt = typeof payload.exp === 'number' ? payload.exp : issuedAt + DEFAULT_SESSION_TTL
    return {
      userId: payload.userId as string,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: normaliseAdminRole(payload.role) as AdminRole,
      issuedAt,
      expiresAt,
    }
  } catch (error) {
    console.error('Failed to verify admin session token', error)
    return null
  }
}

export async function requireAdmin(role: AdminRole = 'ADMIN') {
  const session = getSession()
  if (!session || session.role !== role) {
    redirect('/login')
  }
  const user = await prisma.user.findUnique({ where: { id: session!.userId } })
  if (!user) redirect('/login')
  return user
}

export async function createAdminIfMissing(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return existing
  const hashed = await hashPassword(password)
  return prisma.user.create({ data: { email, password: hashed, role: 'ADMIN' } })
}

const authModule = null
export default authModule
 
