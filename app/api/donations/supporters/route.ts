import { NextResponse } from 'next/server'
import { z } from 'zod'

import { Prisma, type DonationSupporter } from '@prisma/client'

import { prisma } from '../../../../lib/prisma'

const CHANNELS = ['M-Pesa', 'PayPal', 'Cash/Other'] as const
const SHARE_OPTIONS = ['pending', 'granted', 'declined'] as const
const RECENT_WINDOW_DAYS = 30
const RECENT_WINDOW_MS = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000

type Channel = (typeof CHANNELS)[number]

type TotalsSnapshot = {
	totalAmount: number
	totalGifts: number
	totalSupporters: number
	publicSupporters: number
	activeSupporters: number
	newSupporters: number
}

type SupporterSnapshot = {
	id: string
	firstName: string
	totalAmount: number
	donationCount: number
	lastChannel: Channel | null
	lastContributionAt: string | null
	publicAcknowledgement: boolean
}

type SupporterTrendPoint = {
	date: string
	newSupporters: number
}

const postSchema = z.object({
	firstName: z.string().min(1).max(80),
	amount: z.number().positive(),
	channel: z.enum(CHANNELS),
	shareConsent: z.enum(SHARE_OPTIONS).optional()
})

const patchSchema = z
	.object({
		supporterId: z.string().uuid().optional(),
		firstName: z.string().min(1).max(80).optional(),
		shareConsent: z.enum(['granted', 'declined'])
	})
	.refine(data => Boolean(data.supporterId || data.firstName), {
		message: 'supporterId or firstName is required'
	})

const sanitizeName = (value: string) =>
	value
		.normalize('NFKC')
		.replace(/[\p{Control}\p{Number}]/gu, '')
		.trim()
		.replace(/\s+/g, ' ')

const toTitleCase = (value: string) =>
	value
		.split(' ')
		.filter(Boolean)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ')

const normalizeName = (value: string) =>
	value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')

const isChannel = (value: unknown): value is Channel =>
	typeof value === 'string' && CHANNELS.includes(value as Channel)

const mapSupporter = (supporter: DonationSupporter): SupporterSnapshot => ({
	id: supporter.id,
	firstName: supporter.firstName,
	totalAmount: supporter.totalAmount,
	donationCount: supporter.donationCount,
	lastChannel: isChannel(supporter.lastChannel) ? supporter.lastChannel : null,
	lastContributionAt: supporter.lastContributionAt ? supporter.lastContributionAt.toISOString() : null,
	publicAcknowledgement: supporter.publicAcknowledgement ?? false
})

type AggregateResult = {
	_sum: { totalAmount: number | null; donationCount: number | null } | null
	_count: { _all: number } | null
}

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

const computeTotals = async (): Promise<TotalsSnapshot> => {
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

const computeOverview = async () => {
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

const getSnapshots = async () => {
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

export async function GET() {
	try {
		const snapshot = await getSnapshots()
		return NextResponse.json(snapshot)
	} catch (error) {
		console.error('Failed to load donation supporters', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const payload = postSchema.parse(await request.json())
		const sanitized = toTitleCase(sanitizeName(payload.firstName))

		if (!sanitized) {
			return NextResponse.json({ error: 'invalid-name' }, { status: 400 })
		}

		const normalizedName = normalizeName(sanitized)
		if (!normalizedName) {
			return NextResponse.json({ error: 'invalid-name' }, { status: 400 })
		}
		const contributionAmount = Math.round(payload.amount)
		const now = new Date()

		const updateData: Parameters<typeof prisma.donationSupporter.upsert>[0]['update'] = {
			firstName: sanitized,
			totalAmount: { increment: contributionAmount },
			donationCount: { increment: 1 },
			lastChannel: payload.channel,
			lastContributionAt: now
		}

		if (payload.shareConsent === 'granted') {
			updateData.publicAcknowledgement = true
		} else if (payload.shareConsent === 'declined') {
			updateData.publicAcknowledgement = false
		}

		const supporter = await prisma.donationSupporter.upsert({
			where: { normalizedName },
			create: {
				firstName: sanitized,
				normalizedName,
				totalAmount: contributionAmount,
				donationCount: 1,
				lastChannel: payload.channel,
				lastContributionAt: now,
				publicAcknowledgement: payload.shareConsent === 'granted'
			},
			update: updateData
		})

		const overview = await computeOverview()

		return NextResponse.json({
			supporter: mapSupporter(supporter),
			totals: overview.totals,
			recentNewSupporters: overview.recentNewSupporters
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
		}

		console.error('Failed to record donation supporter', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}

export async function PATCH(request: Request) {
	try {
		const payload = patchSchema.parse(await request.json())
		const shareConsent = payload.shareConsent
		const publicAcknowledgement = shareConsent === 'granted'

		let supporter

		if (payload.supporterId) {
			supporter = await prisma.donationSupporter.update({
				where: { id: payload.supporterId },
				data: {
					publicAcknowledgement
				}
			})
		} else if (payload.firstName) {
			const sanitized = toTitleCase(sanitizeName(payload.firstName))
			if (!sanitized) {
				return NextResponse.json({ error: 'invalid-name' }, { status: 400 })
			}

			const normalizedName = normalizeName(sanitized)
			if (!normalizedName) {
				return NextResponse.json({ error: 'invalid-name' }, { status: 400 })
			}

			supporter = await prisma.donationSupporter.update({
				where: { normalizedName },
				data: {
					publicAcknowledgement
				}
			})
		} else {
			return NextResponse.json({ error: 'invalid-request' }, { status: 400 })
		}

		const overview = await computeOverview()

		return NextResponse.json({
			supporter: mapSupporter(supporter),
			totals: overview.totals,
			recentNewSupporters: overview.recentNewSupporters
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
		}

		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
			return NextResponse.json({ error: 'not-found' }, { status: 404 })
		}

		if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === 'P2025') {
			return NextResponse.json({ error: 'not-found' }, { status: 404 })
		}

		console.error('Failed to update supporter acknowledgement', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}
