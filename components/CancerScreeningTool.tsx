'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import {
	BREAST_QUESTIONS,
	buildScreeningSummary,
	CERVICAL_QUESTIONS,
	type CancerScreeningAnswer,
	type CancerScreeningQuestion,
	type ScreeningSummary
} from '../lib/cancerScreening'

function QuestionGroup({
	title,
	description,
	questions,
	answers,
	onAnswer
}: {
	title: string
	description: string
	questions: readonly CancerScreeningQuestion[]
	answers: Record<string, CancerScreeningAnswer | undefined>
	onAnswer: (id: string, answer: CancerScreeningAnswer) => void
}) {
	return (
		<section className="space-y-4">
			<header className="space-y-2">
				<h2 className="text-xl font-semibold text-slate-900">{title}</h2>
				<p className="text-sm text-slate-600">{description}</p>
			</header>
			<div className="space-y-4">
				{questions.map((question) => {
					const selected = answers[question.id]

					return (
						<div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-medium text-slate-900">{question.prompt}</p>
							{question.detail && <p className="mt-2 text-xs text-slate-500">{question.detail}</p>}
							<div className="mt-3 flex gap-3">
								<button
									type="button"
									className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
										selected === 'yes'
											? 'border-primary bg-primary text-white'
											: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/40 hover:bg-primary/5'
									}`}
									onClick={() => onAnswer(question.id, 'yes')}
								>
									Yes
								</button>
								<button
									type="button"
									className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
										selected === 'no'
											? 'border-primary bg-primary text-white'
											: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/40 hover:bg-primary/5'
									}`}
									onClick={() => onAnswer(question.id, 'no')}
								>
									No
								</button>
							</div>
						</div>
					)
				})}
			</div>
		</section>
	)
}

function SummaryCard({ summary }: { summary: ScreeningSummary }) {
	return (
		<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div>
				<p className="text-sm font-semibold uppercase tracking-wide text-primary">
					{summary.type === 'breast' ? 'Breast assessment' : 'Cervical assessment'}
				</p>
				<p className="mt-1 text-lg font-semibold text-slate-900">
					{summary.needsEvaluation ? 'Follow-up needed' : 'No warning signs reported'}
				</p>
				<p className="mt-1 text-sm text-slate-600">
					You answered {summary.totalQuestions} questions. {summary.positives.length} response{summary.positives.length === 1 ? '' : 's'} flagged a concern.
				</p>
			</div>
			{summary.positives.length > 0 && (
				<ul className="space-y-1 rounded-xl bg-primary/5 p-3 text-sm text-slate-700">
					{summary.positives.map((item) => (
						<li key={item}>• {item}</li>
					))}
				</ul>
			)}
			<p className="text-sm text-slate-700">{summary.recommendation}</p>
			{summary.type === 'cervical' && !summary.needsEvaluation && (
				<p className="text-xs text-slate-500">
					If you are 25 years or older, routine screening every three years (or as advised) helps catch changes early.
				</p>
			)}
			<div className="flex flex-col gap-3 pt-2 sm:flex-row">
				<Link href="/contact" className="btn-primary justify-center">Book at our clinic</Link>
				<a href="tel:+254707711888" className="btn-outline justify-center">Call +254 707 711 888</a>
			</div>
		</div>
	)
}

export default function CancerScreeningTool() {
	const [breastAnswers, setBreastAnswers] = useState<Record<string, CancerScreeningAnswer | undefined>>({})
	const [cervicalAnswers, setCervicalAnswers] = useState<Record<string, CancerScreeningAnswer | undefined>>({})
	const [error, setError] = useState<string | null>(null)
	const [showSummary, setShowSummary] = useState(false)

	const summaries = useMemo(() => {
		if (!showSummary) return null

		const breast = buildScreeningSummary('breast', BREAST_QUESTIONS, breastAnswers)
		const cervical = buildScreeningSummary('cervical', CERVICAL_QUESTIONS, cervicalAnswers)

		return { breast, cervical }
	}, [showSummary, breastAnswers, cervicalAnswers])

	const allBreastAnswered = BREAST_QUESTIONS.every((question) => breastAnswers[question.id])
	const allCervicalAnswered = CERVICAL_QUESTIONS.every((question) => cervicalAnswers[question.id])

	const handleAnswer = (
		type: 'breast' | 'cervical',
		id: string,
		answer: CancerScreeningAnswer
	) => {
		if (type === 'breast') {
			setBreastAnswers((prev) => ({ ...prev, [id]: answer }))
		} else {
			setCervicalAnswers((prev) => ({ ...prev, [id]: answer }))
		}
	}

	const handleReview = () => {
		if (!allBreastAnswered || !allCervicalAnswered) {
			setError('Please answer every question so we can give the right guidance.')
			setShowSummary(false)
			return
		}

		setError(null)
		setShowSummary(true)
	}

	return (
		<section className="mx-auto max-w-5xl space-y-8">
			<header className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
				<h1 className="text-3xl font-semibold text-slate-900">Breast and cervical health check</h1>
				<p className="text-base text-slate-600">
					Answer a few yes or no questions about common warning signs. Your responses stay on this device. If you notice symptoms, we will guide you to the next step.
				</p>
				<p className="text-sm text-slate-500">
					This guide does not replace a clinical exam. If you feel unwell, please visit a clinician even if your answers here are all “No”.
				</p>
			</header>

			<div className="space-y-10">
				<QuestionGroup
					title="Breast changes"
					description="These questions focus on common breast warning signs."
					questions={BREAST_QUESTIONS}
					answers={breastAnswers}
					onAnswer={(id, value) => handleAnswer('breast', id, value)}
				/>

				<QuestionGroup
					title="Cervical and pelvic changes"
					description="These questions cover cervical warning signs and screening history."
					questions={CERVICAL_QUESTIONS}
					answers={cervicalAnswers}
					onAnswer={(id, value) => handleAnswer('cervical', id, value)}
				/>
			</div>

			<div className="space-y-3">
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button type="button" className="btn-primary" onClick={handleReview}>
					Review guidance
				</button>
			</div>

			{showSummary && summaries && (
				<div className="space-y-6">
					<SummaryCard summary={summaries.breast} />
					<SummaryCard summary={summaries.cervical} />
					<p className="text-xs text-slate-500">
						If you decide to visit a nearby facility, please share the outcome with us. We can help with follow-up care and keep your record up to date.
					</p>
				</div>
			)}
		</section>
	)
}
