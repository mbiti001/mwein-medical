import { NextResponse } from 'next/server'

import type { Phq9Severity } from '../../../../lib/phq9'
import { prisma } from '../../../../lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnalyticsPayload =
	| { event: 'started' }
	| { event: 'completed'; severity: Phq9Severity; positive: boolean; harm: boolean }
	| { event: 'telehealth_cta' }
	| { event: 'call_cta' }

const SEVERITY_KEYS: Record<Phq9Severity, string> = {
	minimal: 'phq9_severity_minimal',
	mild: 'phq9_severity_mild',
	moderate: 'phq9_severity_moderate',
	'moderately-severe': 'phq9_severity_moderately_severe',
	severe: 'phq9_severity_severe'
}

function isAnalyticsPayload(body: unknown): body is AnalyticsPayload {
	if (!body || typeof body !== 'object') {
		return false
	}

	const payload = body as Record<string, unknown>

	switch (payload.event) {
		case 'started': {
			return true
		}
		case 'completed': {
			return (
				typeof payload.severity === 'string' &&
				(payload.severity as Phq9Severity) in SEVERITY_KEYS &&
				typeof payload.positive === 'boolean' &&
				typeof payload.harm === 'boolean'
			)
		}
		case 'telehealth_cta':
		case 'call_cta': {
			return true
		}
		default:
			return false
	}
}

async function incrementMetric(key: string) {
	await prisma.siteMetric.upsert({
		where: { key },
		create: { key, count: 1 },
		update: { count: { increment: 1 } }
	})
}

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => null)

		if (!isAnalyticsPayload(body)) {
			return NextResponse.json({ error: 'invalid-payload' }, { status: 400 })
		}

		const keys: string[] = []

		switch (body.event) {
			case 'started':
				keys.push('phq9_started_total')
				break
			case 'completed':
				keys.push('phq9_completed_total', SEVERITY_KEYS[body.severity])
				if (body.positive) {
					keys.push('phq9_positive_total')
				}
				if (body.harm) {
					keys.push('phq9_harm_flags')
				}
				break
			case 'telehealth_cta':
				keys.push('phq9_cta_telehealth')
				break
			case 'call_cta':
				keys.push('phq9_cta_call')
				break
		}

		await Promise.all(keys.map((key) => incrementMetric(key)))

		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error('Failed to record mental health analytics', error)
		return NextResponse.json({ error: 'server-error' }, { status: 500 })
	}
}
