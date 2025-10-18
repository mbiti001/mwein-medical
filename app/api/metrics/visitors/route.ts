import { NextResponse } from 'next/server'

import { prisma } from '../../../../lib/prisma'

const METRIC_KEY = 'donation_page_visitors'

export async function GET() {
	try {
		const metric = await prisma.siteMetric.findUnique({
			where: { key: METRIC_KEY }
		})

		return NextResponse.json({ count: metric?.count ?? 0 })
	} catch (error) {
		console.error('Failed to read visitor metric', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}

export async function POST() {
	try {
		const metric = await prisma.siteMetric.upsert({
			where: { key: METRIC_KEY },
			create: { key: METRIC_KEY, count: 1 },
			update: { count: { increment: 1 } }
		})

		return NextResponse.json({ count: metric.count })
	} catch (error) {
		console.error('Failed to increment visitor metric', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}
