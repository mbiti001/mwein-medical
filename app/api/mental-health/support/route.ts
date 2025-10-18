import { NextResponse } from 'next/server'

import type { Phq9Severity } from '../../../../lib/phq9'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

const FALLBACK_MESSAGES: Record<Phq9Severity, string> = {
	minimal: 'Thank you for taking time to check in. Your responses suggest minimal depressive symptoms today. Continue with the routines that support your wellbeing, and reach out whenever you need to talk.',
	mild: 'You shared some early signs of strain. Gentle routines—like staying connected to people who care about you, breathing exercises, and regular movement—can help. We are here if you want to talk more.',
	moderate: 'Your answers show that this has been a heavy stretch. Talking with a clinician can help create a plan that matches your realities. We would be honoured to support you via telehealth or in person.',
	'moderately-severe': 'You are carrying a lot right now. Connecting with our mental health team soon can provide relief and a path forward. Please consider booking a telehealth visit or coming to the clinic when you can.',
	severe: 'Your responses show that things feel very difficult. Please reach out for immediate support—call the clinic, visit us, or contact emergency services. You do not have to walk through this alone.'
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
			'You are a licensed Kenyan mental health clinician crafting a brief, empathetic response for a digital self-check conversation. Respond in English. Use warm, person-first language, and emphasise that help is available. Do not provide a diagnosis, never mention the PHQ-9 directly, and do not make promises you cannot guarantee. The clinic offers 24/7 telehealth and in-person support. Include clear next steps, encourage reaching out to trusted supports, and remind them emergency services (999 or 1199 in Kenya) are available. Keep the response under 120 words.'
	}

	const user: OpenAiMessage = {
		role: 'user',
		content: `Screening summary: total score ${score}. Severity category: ${severity}. Positive screen: ${positive}. Self-harm response level: ${harmResponse}. Craft a caring 3-4 sentence reply, thank them for sharing, highlight that their feelings matter, and invite them to connect with the clinic via telehealth or in person. If self-harm response level is 1 or higher, explicitly encourage urgent contact with emergency services and the clinic.`
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
		? ' Because you mentioned thoughts of self-harm, please contact emergency services (999 or 1199) or visit the nearest facility immediately, and let someone you trust know how you are feeling.'
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
