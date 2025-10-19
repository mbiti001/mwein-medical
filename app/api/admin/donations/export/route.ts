import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../../../lib/prisma'
import { auditLog } from '../../../../../lib/audit'
import { getAuthenticatedAdmin } from '../../../../../lib/authServer'
import { hasAtLeast } from '../../../../../lib/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MINIMUM_ROLE = 'PHARMACY'

function toNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toDate(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function csvCell(input: unknown): string {
  const value = input ?? ''
  const stringValue = typeof value === 'string' ? value : String(value)
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
}

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!hasAtLeast(admin.role, MINIMUM_ROLE)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const min = toNumber(url.searchParams.get('min'))
  const max = toNumber(url.searchParams.get('max'))
  const from = toDate(url.searchParams.get('from'))
  const to = toDate(url.searchParams.get('to'))

  const where: Prisma.DonationTransactionWhereInput = {}

  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { phone: { contains: q } },
      { mpesaReceiptNumber: { contains: q } },
      { accountReference: { contains: q } }
    ]
  }

  if (min !== null || max !== null) {
    where.amount = {
      ...(min !== null ? { gte: min } : {}),
      ...(max !== null ? { lte: max } : {})
    }
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    }
  }

  const rows = await prisma.donationTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000
  })

  const header = ['createdAt', 'firstName', 'amount', 'channel', 'status', 'phone', 'accountReference', 'mpesaReceiptNumber']
  const csv = [
    header.join(','),
    ...rows.map(row => [
      row.createdAt.toISOString(),
      row.firstName,
      row.amount,
      'M-Pesa',
      row.status,
      row.phone,
      row.accountReference ?? '',
      row.mpesaReceiptNumber ?? ''
    ].map(csvCell).join(','))
  ].join('\n')

  await auditLog({
    adminId: admin.id,
    action: 'EXPORT_DONATION_CSV',
    route: '/api/admin/donations/export',
    ip: request.headers.get('x-forwarded-for'),
    payload: { count: rows.length }
  })

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="donations-${Date.now()}.csv"`
    }
  })
}
