import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '../../../../lib/prisma'

const payloadSchema = z
	.object({
		outcome: z.enum(['FOUND', 'NOT_FOUND', 'OTHER']),
		explanation: z.string().trim().max(1_000).optional(),
		email: z.string().trim().email().max(256).optional(),
		pagePath: z.string().trim().max(200).optional()
	})
	.superRefine((data, ctx) => {
		if (data.outcome !== 'FOUND' && (!data.explanation || data.explanation.trim().length === 0)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['explanation'],
				message: 'Please share what you were looking for so we can assist.'
			})
		}
	})

export async function POST(request: Request) {
	let parsedBody: z.infer<typeof payloadSchema>

	try {
		const json = await request.json()
		const result = payloadSchema.safeParse(json)

		if (!result.success) {
			return NextResponse.json({ error: 'invalid', issues: result.error.flatten() }, { status: 400 })
		}

		parsedBody = result.data
	} catch (error) {
		console.error('Exit feedback parsing failed', error)
		return NextResponse.json({ error: 'invalid' }, { status: 400 })
	}

	try {
		const record = await prisma.exitFeedback.create({
			data: {
				outcome: parsedBody.outcome,
				explanation: parsedBody.explanation?.trim() || null,
				email: parsedBody.email?.trim() || null,
				pagePath: parsedBody.pagePath ?? null
			}
		})

		return NextResponse.json({ ok: true, id: record.id }, { status: 201 })
	} catch (error) {
		console.error('Exit feedback persistence failed', error)
		return NextResponse.json({ error: 'server' }, { status: 500 })
	}
}
