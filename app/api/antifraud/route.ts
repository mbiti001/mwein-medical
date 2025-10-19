import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '../../../lib/prisma'
import { sendEmail } from '../../../lib/email'
import { identifyClient, shouldDropForHoneypot, checkRateLimit } from '../../../lib/contactProtection'

const trimmedString = (options: { min?: number; max: number }) =>
  z.preprocess(value => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return value
  }, z.string().min(options.min ?? 1).max(options.max))

const optionalTrimmedString = (options: { min?: number; max: number }) =>
  z.preprocess(value => {
    if (value === null || value === undefined) {
      return undefined
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length === 0 ? undefined : trimmed
    }
    return value
  }, z.string().min(options.min ?? 1).max(options.max).optional())

const baseSubmissionSchema = z.object({
  reporterAlias: optionalTrimmedString({ min: 2, max: 120 }),
  reporterContact: optionalTrimmedString({ min: 5, max: 200 }),
  suspectName: trimmedString({ min: 2, max: 160 }),
  suspectPhone: trimmedString({ min: 7, max: 32 }),
  transactionAmount: z.preprocess(
    value => {
      if (value === null || value === undefined || value === '') {
        return undefined
      }
      if (typeof value === 'number') {
        return value
      }
      if (typeof value === 'string') {
        const cleaned = value.replace(/[\,\s]/g, '')
        if (!cleaned) {
          return undefined
        }
        const parsed = Number(cleaned)
        return Number.isFinite(parsed) ? parsed : NaN
      }
      return NaN
    },
    z
      .number()
      .positive('Enter the amount paid (numbers only).')
      .max(10_000_000, 'Amount is unexpectedly high; please double-check.')
  ),
  transactionDate: trimmedString({ min: 4, max: 64 }),
  transactionReason: trimmedString({ min: 10, max: 500 }),
  evidenceSummary: trimmedString({ min: 20, max: 2000 }),
  evidenceUrl: optionalTrimmedString({ min: 5, max: 500 }),
  botField: z.string().max(0).optional()
})

const submissionSchema = baseSubmissionSchema.superRefine((data, ctx) => {
  if (data.transactionDate) {
    const parsed = parseDateInput(data.transactionDate)
    if (!parsed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transactionDate'],
        message: 'Provide a valid date (YYYY-MM-DD or DD/MM/YYYY).'
      })
    }
  }
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  const identifier = identifyClient(request.headers)

  try {
    const payload = await request.json()

    if (shouldDropForHoneypot(payload.botField)) {
      console.warn('Antifraud honeypot triggered', { identifier })
      return NextResponse.json({ ok: true })
    }

    if (checkRateLimit(identifier)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }

    const parsed = submissionSchema.parse(payload)
    const transactionDateValue = parseDateInput(parsed.transactionDate)

    const report = await prisma.antifraudReport.create({
      data: {
        reporterAlias: parsed.reporterAlias,
        reporterContact: parsed.reporterContact,
        suspectName: parsed.suspectName,
        suspectPhone: parsed.suspectPhone,
        transactionAmount: Math.round(parsed.transactionAmount),
        transactionReason: parsed.transactionReason,
        transactionDate: transactionDateValue,
        evidenceSummary: parsed.evidenceSummary,
        evidenceUrl: parsed.evidenceUrl,
        identifier: identifier !== 'unknown' ? identifier : null
      }
    })

    const formattedAmount = formatKes(report.transactionAmount)
    const transactionDate = formatDisplayDate(report.transactionDate)

    const html = `
      <p><strong>Alias / reporter:</strong> ${report.reporterAlias || 'Anonymous'}</p>
      <p><strong>Contact for follow-up:</strong> ${report.reporterContact || 'Not provided'}</p>
      <p><strong>Clinician/Employee named:</strong> ${report.suspectName || 'Not provided'}</p>
      <p><strong>Phone number involved:</strong> ${report.suspectPhone || 'Not provided'}</p>
      <p><strong>Amount reported:</strong> ${formattedAmount}</p>
      <p><strong>Date of transaction:</strong> ${transactionDate}</p>
      <p><strong>Reason stated for sending to phone number:</strong><br/>${renderMultiline(report.transactionReason)}</p>
      <p><strong>Summary / evidence:</strong><br/>${renderMultiline(report.evidenceSummary)}</p>
      <p><strong>Evidence link:</strong> ${report.evidenceUrl ? `<a href="${report.evidenceUrl}">${report.evidenceUrl}</a>` : 'Not provided'}</p>
      <hr />
      <p>Please cross-check the clinic accounts for the exact amount, name, date, and explanation above. Confirm whether a deposit reached the official account or till and investigate any diversion to personal numbers.</p>
    `

    const text = `Antifraud report submitted\n\nAlias / reporter: ${report.reporterAlias || 'Anonymous'}\nContact: ${report.reporterContact || 'Not provided'}\nClinician/Employee named: ${report.suspectName || 'Not provided'}\nPhone number involved: ${report.suspectPhone || 'Not provided'}\nAmount reported: ${formattedAmount}\nDate of transaction: ${transactionDate}\nReason stated: ${report.transactionReason}\nEvidence summary:\n${report.evidenceSummary}\nEvidence link: ${report.evidenceUrl || 'Not provided'}\n\nAction: Counter-check accounts for the exact amount, name, date, and reason. Confirm if funds reached official channels or were diverted to a personal number.`

    const emailResult = await sendEmail({
      to: 'mweinmedical@gmail.com',
      subject: '⚠️ Antifraud alert submitted',
      html,
      text
    })

    if (emailResult.status !== 'sent') {
      console.warn('Antifraud alert email not sent', emailResult)
    }

    return NextResponse.json({ ok: true, id: report.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid', details: error.flatten() }, { status: 422 })
    }

    console.error('Antifraud submission failed', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}

function parseDateInput(value?: string | null) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function formatKes(amount?: number | null) {
  if (typeof amount === 'number' && Number.isFinite(amount)) {
    return `KES ${amount.toLocaleString('en-KE')}`
  }
  return 'Not provided'
}

function formatDisplayDate(date?: Date | null) {
  if (!date) {
    return 'Not provided'
  }

  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function renderMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br/>')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
