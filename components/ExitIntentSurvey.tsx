"use client"

import { createPortal } from 'react-dom'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'mwein-exit-survey-dismissed'
const TRIGGER_COOLDOWN_MS = 120_000

const OUTCOMES = {
	FOUND: 'FOUND',
	NOT_FOUND: 'NOT_FOUND',
	OTHER: 'OTHER'
} as const

type Outcome = (typeof OUTCOMES)[keyof typeof OUTCOMES]

type SubmitState = 'idle' | 'submitting' | 'success' | 'server-error'

type DismissalReason = 'dismissed' | 'submitted'

export default function ExitIntentSurvey() {
	const pathname = usePathname()
	const [visible, setVisible] = useState(false)
	const [outcome, setOutcome] = useState<Outcome>(OUTCOMES.FOUND)
	const [explanation, setExplanation] = useState('')
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<SubmitState>('idle')
	const [validationError, setValidationError] = useState(false)

	const triggeredRef = useRef(false)
	const lastClosedRef = useRef<number>(0)
	const focusReturnRef = useRef<HTMLElement | null>(null)

	const requiresExplanation = useMemo(() => outcome !== OUTCOMES.FOUND, [outcome])
	const isSubmitting = status === 'submitting'

	const resetServerError = useCallback(() => {
		if (status === 'server-error') {
			setStatus('idle')
		}
	}, [status])

	const persistDismissal = useCallback(
		(reason: DismissalReason) => {
			if (typeof window === 'undefined') return
			try {
				sessionStorage.setItem(
					STORAGE_KEY,
					JSON.stringify({ reason, timestamp: new Date().toISOString(), path: pathname ?? '/' })
				)
			} catch (error) {
				console.warn('Failed to persist exit survey state', error)
			}
		},
		[pathname]
	)

	const closeSurvey = useCallback(
		(reason: DismissalReason) => {
			setVisible(false)
			lastClosedRef.current = Date.now()
			triggeredRef.current = true
			persistDismissal(reason)
		},
		[persistDismissal]
	)

	const openSurvey = useCallback(() => {
		if (triggeredRef.current) return
		if (visible) return

		const now = Date.now()
		if (now - lastClosedRef.current < TRIGGER_COOLDOWN_MS) return

		triggeredRef.current = true
		setOutcome(OUTCOMES.FOUND)
		setExplanation('')
		setEmail('')
		setStatus('idle')
		setVisible(true)
		setValidationError(false)
	}, [visible])

	const sendFeedback = useCallback(
		async ({
			outcome: selectedOutcome,
			explanation: providedExplanation,
			email: providedEmail
		}: {
			outcome: Outcome
			explanation?: string
			email?: string
		}) => {
			if (isSubmitting) return
			setStatus('submitting')

			try {
				const response = await fetch('/api/feedback/exit-intent', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						outcome: selectedOutcome,
						explanation: providedExplanation?.trim() || undefined,
						email: providedEmail?.trim() || undefined,
						pagePath: pathname ?? '/'
					})
				})

				if (!response.ok) {
					throw new Error('Request failed')
				}

				setStatus('success')
				setTimeout(() => closeSurvey('submitted'), 1200)
			} catch (error) {
				console.error('Exit survey submission failed', error)
				setStatus('server-error')
			}
		},
		[closeSurvey, isSubmitting, pathname]
	)

	useEffect(() => {
		if (typeof window === 'undefined') return

		try {
			if (sessionStorage.getItem(STORAGE_KEY)) {
				triggeredRef.current = true
				return
			}
		} catch (error) {
			console.warn('Failed to read exit survey state', error)
		}

		const handleMouseOut = (event: MouseEvent) => {
			if (event.relatedTarget) return
			if (event.clientY > 0) return
			openSurvey()
		}

		const handleVisibility = () => {
			if (document.visibilityState === 'hidden') {
				openSurvey()
			}
		}

		window.addEventListener('mouseout', handleMouseOut)
		document.addEventListener('visibilitychange', handleVisibility)

		return () => {
			window.removeEventListener('mouseout', handleMouseOut)
			document.removeEventListener('visibilitychange', handleVisibility)
		}
	}, [openSurvey])

	useEffect(() => {
		if (!visible) return

		focusReturnRef.current = document.activeElement as HTMLElement | null

		const trapFocus = (event: KeyboardEvent) => {
			if (event.key !== 'Tab') return
			const dialog = document.getElementById('exit-survey-dialog')
			if (!dialog) return
			const focusable = dialog.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
			)
			if (focusable.length === 0) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				closeSurvey('dismissed')
			}
		}

		document.addEventListener('keydown', trapFocus)
		document.addEventListener('keydown', handleKeydown)

		const focusTimer = window.setTimeout(() => {
			const dialog = document.getElementById('exit-survey-dialog')
			const firstControl = dialog?.querySelector<HTMLElement>('button, input, textarea, select, a[href]')
			firstControl?.focus()
		}, 40)

		return () => {
			document.removeEventListener('keydown', trapFocus)
			document.removeEventListener('keydown', handleKeydown)
			window.clearTimeout(focusTimer)
		}
	}, [visible, closeSurvey])

	useEffect(() => {
		if (!visible) return

		return () => {
			if (focusReturnRef.current) {
				focusReturnRef.current.focus()
			}
		}
	}, [visible])

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (requiresExplanation && !explanation.trim()) {
			setValidationError(true)
			return
		}

		await sendFeedback({ outcome, explanation, email })
	}

	if (!visible) {
		return null
	}

	return createPortal(
		<div className="exit-survey-overlay" role="presentation">
			<div
				id="exit-survey-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="exit-survey-title"
				className="exit-survey-container"
			>
				<div className="exit-survey-header">
					<div>
						<p className="exit-survey-super">Before you go</p>
						<h2 id="exit-survey-title" className="exit-survey-title">
							Did you find what you were looking for?
						</h2>
					</div>
					<button
						type="button"
						onClick={() => closeSurvey('dismissed')}
						className="exit-survey-close"
						aria-label="Dismiss exit survey"
					>
						Close
					</button>
				</div>
				{status === 'success' ? (
					<div className="exit-survey-success" role="status">
						<p className="exit-survey-success-title">Thank you for helping us improve.</p>
						<p>We read every note to make accessing care easier for the next family.</p>
					</div>
				) : (
					<form className="exit-survey-form" onSubmit={handleSubmit}>
						<fieldset className="exit-survey-options">
							<legend className="sr-only">Select how your visit went</legend>
							{[
								{ value: OUTCOMES.FOUND, label: 'Yes, everything was clear' },
								{ value: OUTCOMES.NOT_FOUND, label: "Not yet — I'm still looking" },
								{ value: OUTCOMES.OTHER, label: 'Other (tell us more)' }
							].map((choice) => (
								<label
									key={choice.value}
									className={`exit-survey-option ${outcome === choice.value ? 'exit-survey-option-active' : ''}`}
								>
									<input
										type="radio"
										name="outcome"
										value={choice.value}
										checked={outcome === choice.value}
										onChange={() => {
											setOutcome(choice.value)
											setValidationError(false)
											resetServerError()
											if (choice.value === OUTCOMES.FOUND) {
												setExplanation('')
												if (!isSubmitting) {
													void sendFeedback({ outcome: OUTCOMES.FOUND, email })
												}
											}
										}}
										disabled={isSubmitting}
										className="sr-only"
									/>
									<span>{choice.label}</span>
								</label>
							))}
						</fieldset>
						{requiresExplanation && (
							<div className="exit-survey-field">
								<label htmlFor="exit-survey-explanation">Tell us what you hoped to find</label>
								<textarea
									id="exit-survey-explanation"
									name="explanation"
									rows={3}
									value={explanation}
									onChange={(event) => {
										setExplanation(event.target.value)
										setValidationError(false)
										resetServerError()
									}}
									required={requiresExplanation}
									className="exit-survey-textarea"
									placeholder="e.g. maternity fees, ambulance cover, clinic location"
								/>
							</div>
						)}
						{outcome !== OUTCOMES.FOUND && (
							<div className="exit-survey-field">
								<label htmlFor="exit-survey-email">Leave an email if you’d like a follow-up (optional)</label>
								<input
									type="email"
									id="exit-survey-email"
									name="email"
									value={email}
									onChange={(event) => {
										setEmail(event.target.value)
										resetServerError()
									}}
									className="exit-survey-input"
									placeholder="you@example.com"
								/>
							</div>
						)}
						{validationError && (
							<p className="exit-survey-error" role="alert">
								Please let us know what you were hoping to find so we can guide you.
							</p>
						)}
						{status === 'server-error' && !validationError && (
							<p className="exit-survey-error" role="alert">
								We couldn’t save that just yet. Please try again in a moment.
							</p>
						)}
						{outcome !== OUTCOMES.FOUND && (
							<div className="exit-survey-actions">
								<a href="/contact" className="btn-outline">
									Contact us
								</a>
								<button type="submit" className="btn-primary" disabled={isSubmitting}>
									{isSubmitting ? 'Sending…' : 'Send feedback'}
								</button>
							</div>
						)}
						{outcome === OUTCOMES.FOUND && status === 'server-error' && (
							<div className="exit-survey-actions">
								<button
									type="button"
									onClick={() => {
										setStatus('idle')
										void sendFeedback({ outcome: OUTCOMES.FOUND, email })
									}}
									className="btn-primary"
								>
									Try again
								</button>
							</div>
						)}
						<p className="exit-survey-footnote">
							We only use this information to improve the website experience and guide families to the right care.
						</p>
					</form>
				)}
			</div>
		</div>,
		document.body
	)
}
