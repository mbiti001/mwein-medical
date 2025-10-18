import { NextResponse } from 'next/server'

import type { Phq9Severity } from '../../../../lib/phq9'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

const FALLBACK_MESSAGES: Record<Phq9Severity, string> = {
	minimal: 'Thank you for checking in. Your answers fall in the minimal range. Keep looking after yourself and repeat the check-in if things change.',
	mild: 'Your answers land in the mild range. Staying connected to people you trust and keeping steady routines may help. Reach out if you would like extra support.',
	moderate: 'Your answers are in the moderate range. Booking a telehealth visit or clinic appointment can help you plan next steps together with a clinician.',
	'moderately-severe': 'Your answers are in the moderately severe range. Please get in touch with our mental health team soon by telehealth or at the clinic so we can assist you.',
	severe: 'Your answers are in the severe range. Please contact the clinic, visit in person, or call emergency services right away for support.'
}

type SupportRequestBody = {
	score?: number
	severity?: Phq9Severity
	positive?: boolean
	harmResponse?: number
}

type OpenAiMessage = {
	role: 'system' | 'user'
	content: string
}

function buildPrompt(body: Required<SupportRequestBody>): OpenAiMessage[] {
	const { score, severity, positive, harmResponse } = body

	const system: OpenAiMessage = {
		role: 'system',
		content:
			'You are a licensed Kenyan mental health clinician crafting a brief, plain-language response for a digital self-check conversation. Respond in English, stay respectful, and avoid assumptions about feelings beyond what is provided. Do not provide a diagnosis, never mention the PHQ-9 directly, and do not make promises you cannot guarantee. Briefly remind them about available support (telehealth, clinic, emergency services 999 or 1199) and invite them to choose what feels right. Keep the response under 120 words.'
	}

	const user: OpenAiMessage = {
		role: 'user',
		content: `Screening summary: total score ${score}. Severity category: ${severity}. Positive screen: ${positive}. Self-harm response level: ${harmResponse}. Craft a caring 3-4 sentence reply that thanks them for sharing, keeps language simple, and offers clear next steps such as telehealth, in-person care, or reaching out to trusted people. If self-harm response level is 1 or higher, clearly advise them to contact emergency services and the clinic right away.`
	}

	return [system, user]
}

function validateBody(body: SupportRequestBody): body is Required<SupportRequestBody> {
	return (
		typeof body.score === 'number' &&
		body.score >= 0 &&
		typeof body.severity === 'string' &&
		['minimal', 'mild', 'moderate', 'moderately-severe', 'severe'].includes(body.severity) &&
		typeof body.positive === 'boolean' &&
		typeof body.harmResponse === 'number'
	)
}

function buildFallback(body: Required<SupportRequestBody>): string {
	const base = FALLBACK_MESSAGES[body.severity]
	const caution = body.harmResponse >= 1
		? ' Because you selected thoughts of self-harm, please call emergency services (999 or 1199) or visit the nearest facility right away, and let someone you trust know.'
		: ''

	const followUp = body.positive
		? ' Our clinicians can connect with you via telehealth or in person—choose whichever feels safer today.'
		: ' If anything changes, send us a message or book a telehealth check-in so we can support you early.'

	return `${base}${caution}${followUp}`
}

export async function POST(request: Request) {
	try {
		const body = (await request.json().catch(() => null)) as SupportRequestBody | null

		if (!body || !validateBody(body)) {
			return NextResponse.json({ error: 'invalid-payload' }, { status: 400 })
		}

	const fallback = buildFallback(body)

	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey) {
		return NextResponse.json({ message: fallback })
	}

	const messages = buildPrompt(body)

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: DEFAULT_MODEL,
			messages,
			temperature: 0.7,
			max_tokens: 220
		})
	})

	if (!response.ok) {
		console.error('OpenAI error', response.status, await response.text())
		return NextResponse.json({ message: fallback })
	}

	const data = (await response.json()) as {
		choices?: Array<{ message?: { content?: string } }>
	}

	const choice = data.choices?.[0]?.message?.content

	if (!choice) {
		return NextResponse.json({ message: fallback })
	}

	return NextResponse.json({ message: choice.trim() })
	} catch (error) {
		console.error('Mental health support route error', error)
		return NextResponse.json({ message: 'Something went wrong while preparing a message. Please reach out to the clinic directly for support.' }, { status: 500 })
	}
}
