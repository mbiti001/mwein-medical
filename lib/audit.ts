import { prisma } from './prisma'

export async function auditLog(params: {
  adminId: string
  action: string
  route: string
  ip?: string | null
  payload?: unknown
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        route: params.route,
        ip: params.ip ?? undefined,
        payload: params.payload ? JSON.stringify(params.payload).slice(0, 8000) : undefined
      }
    })
  } catch (error) {
    console.warn('Audit log skipped', error)
  }
}
