'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import type { Phq9Severity } from '../lib/phq9'
import { interpretPhq9, PHQ9_OPTIONS, PHQ9_QUESTIONS, scorePhq9 } from '../lib/phq9'

type ChatMessage = {
	id: string
	role: 'assistant' | 'user'
	content: string
}

type AnalyticsPayload =
	| { event: 'started' }
	| { event: 'completed'; severity: Phq9Severity; positive: boolean; harm: boolean }
	| { event: 'telehealth_cta' }
	| { event: 'call_cta' }

async function trackAnalytics(payload: AnalyticsPayload) {
	try {
		await fetch('/api/mental-health/analytics', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload),
			keepalive: true
		})
	} catch (error) {
		console.error('Mental health analytics tracking failed', error)
	}
}

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
	return {
		id: `${role}-${Math.random().toString(36).slice(2)}`,
		role,
		content
	}
}

const supportivePhrases = {
	low: 'Thanks for sharing that. I’m here with you.',
	medium: 'I appreciate you being open with me.',
	high: 'Thank you for trusting me with that answer.'
}

type SupportResponse = {
	message: string
}

function harmResponseIsConcerning(responses: number[]): boolean {
	if (responses.length < PHQ9_QUESTIONS.length) return false
	const harmAnswer = responses[responses.length - 1]
	return harmAnswer >= 1
}

export default function MentalHealthAssistant() {
	const [hasStarted, setHasStarted] = useState(false)
	const [questionIndex, setQuestionIndex] = useState(0)
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: 'assistant-intro',
			role: 'assistant',
			content: 'Hi, I’m here to guide a short check-in about how you’ve been feeling. We’ll go through a few quick questions together.'
		},
		{
			id: 'assistant-safety',
			role: 'assistant',
			content: 'This tool can’t handle emergencies. If you need immediate help, please call 999 or 1199 in Kenya or visit the nearest clinic.'
		}
	])
	const [responses, setResponses] = useState<number[]>([])
	const [isLoadingSupport, setIsLoadingSupport] = useState(false)

	const activeQuestion = hasStarted ? PHQ9_QUESTIONS[questionIndex] : null

	const { score, result } = useMemo(() => {
		if (responses.length !== PHQ9_QUESTIONS.length) {
			return { score: null as number | null, result: null }
		}
		const total = scorePhq9(responses)
		return { score: total, result: interpretPhq9(total) }
	}, [responses])

	const handleStart = () => {
		setHasStarted(true)
		setMessages((prev) => [
			...prev,
			createMessage('assistant', 'Thanks for taking a few minutes. I’ll ask each question one at a time, and your answers stay on this device.')
		])
		void trackAnalytics({ event: 'started' })
	}

	const handleAnswer = async (value: number) => {
		if (!activeQuestion) return

		const option = PHQ9_OPTIONS.find((item) => item.value === value)
		const newResponses = [...responses, value]
		setResponses(newResponses)

		setMessages((prev) => [
			...prev,
			createMessage('user', option ? option.label : 'Response submitted')
		])

		const isLastQuestion = questionIndex === PHQ9_QUESTIONS.length - 1

		if (!isLastQuestion) {
			const nextIndex = questionIndex + 1
			const affirmation = value >= 2 ? supportivePhrases.high : value === 1 ? supportivePhrases.medium : supportivePhrases.low
			setMessages((prev) => [
				...prev,
				createMessage('assistant', affirmation)
			])
			setQuestionIndex(nextIndex)
			return
		}

		// Completed the questionnaire
		const totalScore = scorePhq9(newResponses)
		const interpretation = interpretPhq9(totalScore)
		const harmFlagged = harmResponseIsConcerning(newResponses)
		const reassurance = interpretation.isPositiveScreen
			? 'Support is available if you would like it.'
			: 'It can still help to keep an eye on how you feel and reach out when you need to.'

		const summaryMessage = `Thanks for finishing the check-in. Your score is ${totalScore}, which is in the "${interpretation.severity.replace('-', ' ')}" range. ${interpretation.recommendation}`

		setMessages((prev) => [
			...prev,
			createMessage('assistant', summaryMessage),
			createMessage('assistant', reassurance)
		])

		setQuestionIndex(questionIndex + 1)
		void trackAnalytics({
			event: 'completed',
			severity: interpretation.severity,
			positive: interpretation.isPositiveScreen,
			harm: harmFlagged
		})

		try {
			setIsLoadingSupport(true)
			const response = await fetch('/api/mental-health/support', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					score: totalScore,
					severity: interpretation.severity,
					positive: interpretation.isPositiveScreen,
					harmResponse: newResponses[newResponses.length - 1]
				})
			})

			if (response.ok) {
				const data = (await response.json()) as SupportResponse
				if (data?.message) {
					setMessages((prev) => [...prev, createMessage('assistant', data.message)])
				}
			} else {
				console.error('Support message request failed', await response.text())
			}
		} catch (error) {
			console.error('Support message request errored', error)
		} finally {
			setIsLoadingSupport(false)
		}
	}

	const hasCompleted = responses.length === PHQ9_QUESTIONS.length
	const harmConcern = harmResponseIsConcerning(responses)

	return (
		<section className="mx-auto max-w-4xl space-y-8">
			<header className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
				<h1 className="text-3xl font-semibold text-slate-900">Mental health check-in</h1>
				<p className="text-base text-slate-600">
					This guided conversation uses the clinically validated PHQ-9 questionnaire to understand how you have been feeling over the last two weeks. Your answers stay on this device—we do not store them. If you are in immediate danger, please reach out to emergency services (Kenya: <strong>999</strong> or <strong>1199</strong>) or visit the nearest facility right away.
				</p>
				<p className="text-sm text-slate-500">
					The PHQ-9 is a screening tool—it doesn&apos;t replace a clinical evaluation. We&apos;ll help you connect with our clinicians if you would like support after the self-check.
				</p>
			</header>

			<div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
				<div className="space-y-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
					<h2 className="text-lg font-semibold text-slate-900">Supportive assistant</h2>
					<p className="text-sm text-slate-600">I&apos;ll ask one question at a time and offer next steps based on your responses.</p>
				</div>

				<div className="space-y-4 px-6 py-6">
					<div className="space-y-4">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
									message.role === 'assistant'
										? 'bg-slate-100 text-slate-800'
									:
										'bg-primary text-white ml-auto'
								}`}
							>
								{message.content}
							</div>
						))}
					</div>

					{!hasStarted ? (
						<div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
							<p>When you&apos;re ready, start the PHQ-9 check-in. It usually takes less than three minutes.</p>
							<button type="button" className="btn-primary self-start" onClick={handleStart}>
								Begin PHQ-9 check-in
							</button>
						</div>
					) : hasCompleted ? (
						<div className="mt-6 space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-slate-700">
							{result && score !== null && (
								<div className="space-y-2">
									<p className="text-base font-semibold text-slate-900">PHQ-9 summary</p>
									<p>
										Score: <strong>{score}</strong> · Severity: <strong>{result.severity.replace('-', ' ')}</strong>
									</p>
									<p>{result.recommendation}</p>
								</div>
							)}
							{harmConcern && (
								<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
									<p className="font-semibold">Immediate support is available</p>
									<p>
										Because you selected thoughts of self-harm, please call emergency services or contact our team right away.
									</p>
								</div>
							)}
							<div className="grid gap-3 sm:grid-cols-2">
								<Link href="/contact" className="btn-primary justify-center" onClick={() => void trackAnalytics({ event: 'telehealth_cta' })}>Book telehealth support</Link>
								<a className="btn-outline justify-center" href="tel:+254707711888" onClick={() => void trackAnalytics({ event: 'call_cta' })}>Call the clinic</a>
							</div>
							<p className="text-xs text-slate-500">
								If you prefer in-person care, you can walk into the clinic 24/7 or visit the nearest trusted facility. Bring a loved one if you would like extra support.
							</p>
							{isLoadingSupport && <p className="text-xs text-slate-400">Preparing a caring message…</p>}
						</div>
					) : (
						activeQuestion && (
							<div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
								<p className="text-base font-semibold text-slate-900">{activeQuestion.prompt}</p>
								{activeQuestion.context && <p className="text-sm text-slate-600">{activeQuestion.context}</p>}
								<div className="grid gap-3 sm:grid-cols-2">
									{PHQ9_OPTIONS.map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => handleAnswer(option.value)}
											className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
										>
											<span className="block font-medium text-slate-900">{option.label}</span>
											<span className="block text-xs text-slate-500">{option.description}</span>
										</button>
									))}
								</div>
							</div>
						)
					)}
				</div>
			</div>
		</section>
	)
}
