import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'

import { prisma } from '../../../lib/prisma'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/auth'
import { APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_STATUS_LABELS, isValidAppointmentStatus } from '../../../lib/appointments'

const patchSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(APPOINTMENT_STATUS_OPTIONS),
  notes: z.string().max(1000).optional()
})

export async function GET() {
  const session = await verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const appointments = await prisma.appointmentRequest.findMany({
    orderBy: [{ createdAt: 'desc' }]
  })

  return NextResponse.json({
    appointments: appointments.map(appointment => ({
      id: appointment.id,
      name: appointment.name,
      phone: appointment.phone,
      email: appointment.email,
      preferredDate: appointment.preferredDate,
      preferredTime: appointment.preferredTime,
      consultationType: appointment.consultationType,
      consultationDate: appointment.consultationDate?.toISOString() ?? null,
      reason: appointment.reason,
      status: appointment.status,
      statusLabel: (() => {
        const statusKey = isValidAppointmentStatus(appointment.status) ? appointment.status : 'NEW'
        return APPOINTMENT_STATUS_LABELS[statusKey]
      })(),
      notes: appointment.notes,
      patientAge: appointment.patientAge,
      patientGender: appointment.patientGender,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString()
    }))
  })
}

export async function PATCH(request: Request) {
  const session = await verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  try {
    const payload = patchSchema.parse(await request.json())

    const updated = await prisma.appointmentRequest.update({
      where: { id: payload.appointmentId },
      data: {
        status: payload.status,
        notes: payload.notes?.trim() ?? null
      }
    })

    return NextResponse.json({
      ok: true,
      appointment: {
        id: updated.id,
        status: updated.status,
        notes: updated.notes,
        updatedAt: updated.updatedAt.toISOString()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
    }

    console.error('Failed to update appointment', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
