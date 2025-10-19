import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
	CHANNELS,
	SHARE_OPTIONS,
	InvalidNameError,
	SupporterNotFoundError,
	getDonationSnapshots,
	recordSupporterContribution,
	setSupporterAcknowledgement
} from '../../../../lib/donations'

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

export async function GET() {
	try {
		const snapshot = await getDonationSnapshots()
		return NextResponse.json(snapshot)
	} catch (error) {
		console.error('Failed to load donation supporters', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const payload = postSchema.parse(await request.json())
		const result = await recordSupporterContribution(payload)
		return NextResponse.json(result)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
		}

		if (error instanceof InvalidNameError) {
			return NextResponse.json({ error: 'invalid-name' }, { status: 400 })
		}

		console.error('Failed to record donation supporter', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}

export async function PATCH(request: Request) {
	try {
		const payload = patchSchema.parse(await request.json())
		const result = await setSupporterAcknowledgement(paymentPayloadToParams(payload))
		return NextResponse.json(result)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
		}

		if (error instanceof InvalidNameError) {
			return NextResponse.json({ error: 'invalid-name' }, { status: 400 })
		}

		if (error instanceof SupporterNotFoundError) {
			return NextResponse.json({ error: 'not-found' }, { status: 404 })
		}

		console.error('Failed to update supporter acknowledgement', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}

function paymentPayloadToParams(payload: z.infer<typeof patchSchema>) {
	return {
		supporterId: payload.supporterId,
		firstName: payload.firstName,
		shareConsent: payload.shareConsent
	}
}
