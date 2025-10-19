import type { AdminRole } from './auth'

const ROLE_RANK: Record<AdminRole, number> = {
  ADMIN: 3,
  PHARMACY: 2,
  CLINIC: 1
}

export function roleRank(role: AdminRole): number {
  return ROLE_RANK[role] ?? 0
}

export function hasAtLeast(role: AdminRole, minimum: AdminRole): boolean {
  return roleRank(role) >= roleRank(minimum)
}
