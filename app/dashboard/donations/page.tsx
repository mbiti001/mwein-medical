import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'

import { prisma } from '../../../lib/prisma'
import { getAuthenticatedAdmin } from '../../../lib/authServer'
import { hasAtLeast } from '../../../lib/rbac'

const numberFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0
})

const integerFormatter = new Intl.NumberFormat('en-KE')

type SearchParams = {
  q?: string
  min?: string
  max?: string
  from?: string
  to?: string
  page?: string
}

function parseParams(params: SearchParams) {
  const q = (params.q ?? '').trim()
  const min = Number(params.min ?? '')
  const max = Number(params.max ?? '')
  const from = params.from ? new Date(params.from) : null
  const to = params.to ? new Date(params.to) : null
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const take = 25

  return {
    q,
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
    from: from && !Number.isNaN(from.getTime()) ? from : null,
    to: to && !Number.isNaN(to.getTime()) ? to : null,
    page,
    take
  }
}

function buildWhere({ q, min, max, from, to }: ReturnType<typeof parseParams>): Prisma.DonationTransactionWhereInput {
  const where: Prisma.DonationTransactionWhereInput = {}

  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { phone: { contains: q } },
      { mpesaReceiptNumber: { contains: q } },
      { accountReference: { contains: q } }
    ]
  }

  if (min > 0 || max > 0) {
    where.amount = {
      ...(min > 0 ? { gte: min } : {}),
      ...(max > 0 ? { lte: max } : {})
    }
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    }
  }

  return where
}

export const dynamic = 'force-dynamic'

export default async function DashboardDonationsPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await getAuthenticatedAdmin()

  if (!admin) {
    redirect(`/login?redirect=${encodeURIComponent('/dashboard/donations')}`)
  }

  if (!hasAtLeast(admin.role, 'PHARMACY')) {
    redirect('/dashboard')
  }

  const parsed = parseParams(searchParams)
  const where = buildWhere(parsed)
  const skip = (parsed.page - 1) * parsed.take

  const [transactions, totalCount, aggregates, statusCounts] = await Promise.all([
    prisma.donationTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parsed.take
    }),
    prisma.donationTransaction.count({ where }),
    prisma.donationTransaction.aggregate({
      _sum: { amount: true },
      where
    }),
    prisma.donationTransaction.groupBy({
      by: ['status'],
      _count: { _all: true },
      where
    })
  ])

  const pages = Math.max(1, Math.ceil(totalCount / parsed.take))
  const totalAmount = aggregates._sum.amount ?? 0
  const successCount = statusCounts.find(entry => entry.status === 'SUCCESS')?._count._all ?? 0
  const failedCount = statusCounts.find(entry => entry.status === 'FAILED')?._count._all ?? 0

  const queryParams = new URLSearchParams()
  if (parsed.q) queryParams.set('q', parsed.q)
  if (parsed.min) queryParams.set('min', String(parsed.min))
  if (parsed.max) queryParams.set('max', String(parsed.max))
  if (parsed.from) queryParams.set('from', parsed.from.toISOString().slice(0, 10))
  if (parsed.to) queryParams.set('to', parsed.to.toISOString().slice(0, 10))

  const exportSuffix = queryParams.toString()
  const exportCsvHref = `/api/admin/donations/export${exportSuffix ? `?${exportSuffix}` : ''}`
  const exportXlsxHref = `/api/admin/donations/export/xlsx${exportSuffix ? `?${exportSuffix}` : ''}`

  return (
    <main className="space-y-10">
      <header className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Donor stewardship</p>
            <h1 className="text-2xl font-semibold text-white">Mobile donations</h1>
            <p className="text-sm text-slate-400">Filter M-Pesa transactions, export records, and reconcile with supporter acknowledgements.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={exportCsvHref} className="btn-outline border-slate-700 text-slate-100">Export CSV</a>
            <a href={exportXlsxHref} className="btn-outline border-slate-700 text-slate-100">Export XLSX</a>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Total captured</dt>
            <dd className="text-xl font-semibold text-white">{numberFormatter.format(totalAmount)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Transactions</dt>
            <dd className="text-xl font-semibold text-white">{integerFormatter.format(totalCount)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Success / Failed</dt>
            <dd className="text-xl font-semibold text-white">{integerFormatter.format(successCount)} / {integerFormatter.format(failedCount)}</dd>
          </div>
        </dl>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100">
        <form className="grid gap-3 sm:grid-cols-6" method="get">
          <input className="form-input bg-slate-900/60 text-white sm:col-span-2" name="q" placeholder="Search name, phone, reference" defaultValue={parsed.q} />
          <input className="form-input bg-slate-900/60 text-white" name="min" placeholder="Min KSh" defaultValue={parsed.min || ''} inputMode="numeric" />
          <input className="form-input bg-slate-900/60 text-white" name="max" placeholder="Max KSh" defaultValue={parsed.max || ''} inputMode="numeric" />
          <input className="form-input bg-slate-900/60 text-white" type="date" name="from" defaultValue={parsed.from ? parsed.from.toISOString().slice(0, 10) : ''} />
          <input className="form-input bg-slate-900/60 text-white" type="date" name="to" defaultValue={parsed.to ? parsed.to.toISOString().slice(0, 10) : ''} />
          <button className="btn-primary" type="submit">Filter</button>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Supporter</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className="border-b border-slate-900">
                  <td className="px-3 py-2 text-slate-300">{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-100">{transaction.firstName}</td>
                  <td className="px-3 py-2 text-slate-100">{numberFormatter.format(transaction.amount)}</td>
                  <td className="px-3 py-2"><span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide">{transaction.status}</span></td>
                  <td className="px-3 py-2 text-slate-300">{transaction.mpesaReceiptNumber ?? transaction.checkoutRequestId ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-300">{transaction.phone}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>No transactions match your filters yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav className="mt-6 flex flex-wrap gap-2">
            {Array.from({ length: pages }).map((_, index) => {
              const page = index + 1
              const params = new URLSearchParams(queryParams)
              params.set('page', String(page))
              return (
                <Link
                  key={page}
                  href={`/dashboard/donations?${params.toString()}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${page === parsed.page ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-300'}`}
                >
                  Page {page}
                </Link>
              )
            })}
          </nav>
        )}
      </section>
    </main>
  )
}
