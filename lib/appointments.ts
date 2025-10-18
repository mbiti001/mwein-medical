export const APPOINTMENT_STATUS_OPTIONS = ['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const

export type AppointmentStatus = (typeof APPOINTMENT_STATUS_OPTIONS)[number]

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  NEW: 'New request',
  CONTACTED: 'Contacted',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
}

export function isValidAppointmentStatus(value: string | null | undefined): value is AppointmentStatus {
  if (!value) return false
  return (APPOINTMENT_STATUS_OPTIONS as readonly string[]).includes(value)
}

export function normalizeConsultationType(type: string | null | undefined): 'IN_PERSON' | 'TELEHEALTH' | 'UNKNOWN' {
  if (!type) return 'UNKNOWN'
  const normalized = type.toUpperCase()
  if (normalized === 'IN_PERSON' || normalized === 'TELEHEALTH') {
    return normalized
  }
  return 'UNKNOWN'
}

export function getConsultationLabel(type: string | null | undefined) {
  const normalized = normalizeConsultationType(type)
  if (normalized === 'IN_PERSON') return 'In clinic'
  if (normalized === 'TELEHEALTH') return 'Telehealth'
  return 'Unknown'
}
