import { Prisma, type DonationSupporter } from '@prisma/client'

import { prisma } from './prisma'

export const CHANNELS = ['M-Pesa', 'PayPal', 'Cash/Other'] as const
export type Channel = (typeof CHANNELS)[number]

export const SHARE_OPTIONS = ['pending', 'granted', 'declined'] as const
export type ShareConsent = (typeof SHARE_OPTIONS)[number]

export const RECENT_WINDOW_DAYS = 30
const RECENT_WINDOW_MS = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000

type AggregateResult = {
  _sum: { totalAmount: number | null; donationCount: number | null } | null
  _count: { _all: number } | null
}

export type TotalsSnapshot = {
  totalAmount: number
  totalGifts: number
  totalSupporters: number
  publicSupporters: number
  activeSupporters: number
  newSupporters: number
}

export type SupporterSnapshot = {
  id: string
  firstName: string
  totalAmount: number
  donationCount: number
  lastChannel: Channel | null
  lastContributionAt: string | null
  publicAcknowledgement: boolean
}

export type SupporterTrendPoint = {
  date: string
  newSupporters: number
}

export type DonationOverview = {
  totals: TotalsSnapshot
  recentNewSupporters: SupporterTrendPoint[]
}

export function sanitizeName(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[\p{Control}\p{Number}]/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export const isChannel = (value: unknown): value is Channel =>
  typeof value === 'string' && CHANNELS.includes(value as Channel)

export const mapSupporter = (supporter: DonationSupporter): SupporterSnapshot => ({
  id: supporter.id,
  firstName: supporter.firstName,
  totalAmount: supporter.totalAmount,
  donationCount: supporter.donationCount,
  lastChannel: isChannel(supporter.lastChannel) ? supporter.lastChannel : null,
  lastContributionAt: supporter.lastContributionAt ? supporter.lastContributionAt.toISOString() : null,
  publicAcknowledgement: supporter.publicAcknowledgement ?? false
})

const buildTotals = (
  aggregate: AggregateResult,
  counts: { publicSupporters: number; activeSupporters: number; newSupporters: number }
): TotalsSnapshot => ({
  totalAmount: aggregate._sum?.totalAmount ?? 0,
  totalGifts: aggregate._sum?.donationCount ?? 0,
  totalSupporters: aggregate._count?._all ?? 0,
  publicSupporters: counts.publicSupporters,
  activeSupporters: counts.activeSupporters,
  newSupporters: counts.newSupporters
})

export const computeTotals = async (): Promise<TotalsSnapshot> => {
  const recentThreshold = new Date(Date.now() - RECENT_WINDOW_MS)

  const [aggregate, publicSupporters, activeSupporters, newSupporters] = await Promise.all([
    prisma.donationSupporter.aggregate({
      _sum: { totalAmount: true, donationCount: true },
      _count: { _all: true }
    }) as Promise<AggregateResult>,
    prisma.donationSupporter.count({ where: { publicAcknowledgement: true } }),
    prisma.donationSupporter.count({
      where: {
        lastContributionAt: {
          gte: recentThreshold
        }
      }
    }),
    prisma.donationSupporter.count({
      where: {
        createdAt: {
          gte: recentThreshold
        }
      }
    })
  ])

  return buildTotals(aggregate, {
    publicSupporters,
    activeSupporters,
    newSupporters
  })
}

const buildRecentSeries = (rows: Array<{ createdAt: Date }>): SupporterTrendPoint[] => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const dayMs = 24 * 60 * 60 * 1000
  const counts = new Map<string, number>()

  rows.forEach(row => {
    const day = new Date(row.createdAt)
    day.setUTCHours(0, 0, 0, 0)
    const key = day.toISOString().slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  const series: SupporterTrendPoint[] = []

  for (let offset = RECENT_WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * dayMs)
    const key = day.toISOString().slice(0, 10)
    series.push({ date: key, newSupporters: counts.get(key) ?? 0 })
  }

  return series
}

export const computeOverview = async (): Promise<DonationOverview> => {
  const recentThreshold = new Date(Date.now() - RECENT_WINDOW_MS)

  const [totals, recentNewSupporters] = await Promise.all([
    computeTotals(),
    prisma.donationSupporter.findMany({
      where: { createdAt: { gte: recentThreshold } },
      select: { createdAt: true }
    })
  ])

  return {
    totals,
    recentNewSupporters: buildRecentSeries(recentNewSupporters)
  }
}

export const getDonationSnapshots = async () => {
  const [supporters, overview] = await Promise.all([
    prisma.donationSupporter.findMany({
      orderBy: [
        { publicAcknowledgement: 'desc' },
        { lastContributionAt: 'desc' },
        { donationCount: 'desc' }
      ]
    }),
    computeOverview()
  ])

  return {
    supporters: supporters.map(mapSupporter),
    totals: overview.totals,
    recentNewSupporters: overview.recentNewSupporters
  }
}

export class DonationLogicError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'DonationLogicError'
    this.code = code
  }
}

export class InvalidNameError extends DonationLogicError {
  constructor(message = 'Invalid supporter name') {
    super(message, 'invalid-name')
  }
}

export class InvalidRequestError extends DonationLogicError {
  constructor(message = 'Invalid supporter request') {
    super(message, 'invalid-request')
  }
}

export const recordSupporterContribution = async (params: {
  firstName: string
  amount: number
  channel: Channel
  shareConsent?: ShareConsent
}) => {
  const sanitized = toTitleCase(sanitizeName(params.firstName))
  if (!sanitized) {
    throw new InvalidNameError()
  }

  const normalizedName = normalizeName(sanitized)
  if (!normalizedName) {
    throw new InvalidNameError()
  }

  const contributionAmount = Math.round(params.amount)
  const now = new Date()

  const updateData: Parameters<typeof prisma.donationSupporter.upsert>[0]['update'] = {
    firstName: sanitized,
    totalAmount: { increment: contributionAmount },
    donationCount: { increment: 1 },
    lastChannel: params.channel,
    lastContributionAt: now
  }

  if (params.shareConsent === 'granted') {
    updateData.publicAcknowledgement = true
  } else if (params.shareConsent === 'declined') {
    updateData.publicAcknowledgement = false
  }

  const supporter = await prisma.donationSupporter.upsert({
    where: { normalizedName },
    create: {
      firstName: sanitized,
      normalizedName,
      totalAmount: contributionAmount,
      donationCount: 1,
      lastChannel: params.channel,
      lastContributionAt: now,
      publicAcknowledgement: params.shareConsent === 'granted'
    },
    update: updateData
  })

  const overview = await computeOverview()

  return {
    supporter: mapSupporter(supporter),
    totals: overview.totals,
    recentNewSupporters: overview.recentNewSupporters
  }
}

export const updateSupporterAcknowledgement = async (params: {
  supporterId?: string
  firstName?: string
  shareConsent: Exclude<ShareConsent, 'pending'>
}) => {
  const publicAcknowledgement = params.shareConsent === 'granted'

  let supporter: DonationSupporter

  if (params.supporterId) {
    supporter = await prisma.donationSupporter.update({
      where: { id: params.supporterId },
      data: { publicAcknowledgement }
    })
  } else if (params.firstName) {
    const sanitized = toTitleCase(sanitizeName(params.firstName))
    if (!sanitized) {
      throw new InvalidNameError()
    }

    const normalizedName = normalizeName(sanitized)
    if (!normalizedName) {
      throw new InvalidNameError()
    }

    supporter = await prisma.donationSupporter.update({
      where: { normalizedName },
      data: { publicAcknowledgement }
    })
  } else {
    throw new InvalidRequestError()
  }

  const overview = await computeOverview()

  return {
    supporter: mapSupporter(supporter),
    totals: overview.totals,
    recentNewSupporters: overview.recentNewSupporters
  }
}

export class SupporterNotFoundError extends Error {
  constructor(message = 'Supporter not found') {
    super(message)
    this.name = 'SupporterNotFoundError'
  }
}

export const setSupporterAcknowledgement = async (params: {
  supporterId?: string
  firstName?: string
  shareConsent: Exclude<ShareConsent, 'pending'>
}) => {
  try {
    return await updateSupporterAcknowledgement(params)
  } catch (error) {
    if (error instanceof InvalidNameError || error instanceof InvalidRequestError) {
      throw error
    }

    if (
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') ||
      (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2025')
    ) {
      throw new SupporterNotFoundError()
    }

    throw error
  }
}
