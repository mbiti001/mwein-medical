import { cookies } from 'next/headers'

import { ADMIN_SESSION_COOKIE, AdminRole, SessionPayload, normaliseAdminRole, verifyAdminSessionToken } from './auth'
import { prisma } from './prisma'

export type AuthenticatedAdmin = {
  id: string
  email: string
  role: AdminRole
  session: SessionPayload
}

export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null

  const session = await verifyAdminSessionToken(token)
  if (!session) return null

  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } })
  if (!user) {
    return null
  }

  const role = normaliseAdminRole(user.role)

  if (role !== session.role || user.email !== session.email) {
    return {
      id: user.id,
      email: user.email,
      role,
      session: { ...session, email: user.email, role }
    }
  }

  return {
    id: user.id,
    email: user.email,
    role,
    session
  }
}

export function hasRequiredRole(user: { role: AdminRole }, allowedRoles: AdminRole[]) {
  return allowedRoles.includes(user.role)
}
