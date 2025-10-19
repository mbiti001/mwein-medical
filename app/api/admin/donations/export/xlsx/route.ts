import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

import { prisma } from '../../../../../../lib/prisma'
import { auditLog } from '../../../../../../lib/audit'
import { getAuthenticatedAdmin } from '../../../../../../lib/authServer'
import { hasAtLeast } from '../../../../../../lib/rbac'

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

  const worksheetData = rows.map(row => ({
    createdAt: row.createdAt,
    firstName: row.firstName,
    amount: row.amount,
    channel: 'M-Pesa',
    status: row.status,
    phone: row.phone,
    accountReference: row.accountReference ?? '',
    mpesaReceiptNumber: row.mpesaReceiptNumber ?? ''
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Donations')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  await auditLog({
    adminId: admin.id,
    action: 'EXPORT_DONATION_XLSX',
    route: '/api/admin/donations/export/xlsx',
    ip: request.headers.get('x-forwarded-for'),
    payload: { count: rows.length }
  })

  return new NextResponse(buffer, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="donations-${Date.now()}.xlsx"`
    }
  })
}
