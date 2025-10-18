import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { checkRateLimit, identifyClient, shouldDropForHoneypot } from '../../../lib/contactProtection'
import { prisma } from '../../../lib/prisma'

const genderOptions = ['female', 'male', 'non_binary', 'prefer_not_to_say'] as const
const visitTypeOptions = ['in_person', 'telehealth'] as const

const contactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7).max(32),
  email: z.string().email().optional().or(z.literal('')),
  preferredDate: z.string().min(4, 'Preferred date is required'),
  preferredTime: z.string().min(3, 'Preferred time is required'),
  reason: z.string().min(3).max(500),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(genderOptions),
  visitType: z.enum(visitTypeOptions),
  botField: z.string().max(0).optional(),
})

export async function POST(request: Request) {
  let appointmentId: string | null = null

  try {
    const body = await request.json()

    const identifier = identifyClient(request.headers)

    if (shouldDropForHoneypot(body.botField)) {
      console.warn('Contact honeypot triggered', { identifier })
      return NextResponse.json({ ok: true })
    }

    if (checkRateLimit(identifier)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }

    const parsed = contactSchema.parse(body)

    const consultationType = parsed.visitType === 'telehealth' ? 'TELEHEALTH' : 'IN_PERSON'
    const consultationDate = (() => {
      if (!parsed.preferredDate) return null
      const isoString = parsed.preferredTime
        ? `${parsed.preferredDate}T${parsed.preferredTime}`
        : parsed.preferredDate
      const candidate = new Date(isoString)
      return Number.isNaN(candidate.getTime()) ? null : candidate
    })()

    const appointment = await prisma.appointmentRequest.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email || null,
        preferredDate: parsed.preferredDate,
        preferredTime: parsed.preferredTime,
        reason: parsed.reason,
        patientAge: parsed.age,
        patientGender: parsed.gender,
        consultationType,
        consultationDate,
        identifier: identifier !== 'unknown' ? identifier : null
      }
    })
    appointmentId = appointment.id

    // If SMTP is not configured, log and return success so the frontend UX works.
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    const to = process.env.CONTACT_EMAIL || smtpUser

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('Contact submission (no SMTP configured):', parsed)
      return NextResponse.json({ ok: true, notice: 'no-smtp', id: appointment.id })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    })

    const subject = `Appointment request from ${parsed.name}`
    const html = `
      <p><strong>Name:</strong> ${parsed.name}</p>
      <p><strong>Phone:</strong> ${parsed.phone}</p>
      <p><strong>Email:</strong> ${parsed.email || '—'}</p>
      <p><strong>Preferred date:</strong> ${parsed.preferredDate}</p>
      <p><strong>Preferred time:</strong> ${parsed.preferredTime}</p>
      <p><strong>Reason:</strong><br/>${parsed.reason.replace(/\n/g, '<br/>')}</p>
    `

    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to,
      subject,
      html,
    })

    return NextResponse.json({ ok: true, id: appointment.id })
  } catch (err) {
    if (appointmentId) {
      const note = err instanceof Error ? err.message : 'Unknown delivery error'
      await prisma.appointmentRequest.update({
        where: { id: appointmentId },
        data: {
          notes: `Follow up manually. ${note}`
        }
      }).catch(updateError => {
        console.error('Failed to annotate appointment after error', updateError)
      })
    }

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'validation', details: err.format() }, { status: 422 })
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientInitializationError) {
      console.error('Database write failed for contact submission', err)
      return NextResponse.json({ error: 'database' }, { status: 500 })
    }

    console.error('Contact handler error:', err)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
