"use client"

import { useState, ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'
type ErrorState = null | 'validation' | 'rate-limit' | 'server'

type FormState = {
	reporterAlias: string
	reporterContact: string
	suspectName: string
	suspectPhone: string
	transactionAmount: string
	transactionDate: string
	transactionReason: string
	evidenceSummary: string
	evidenceUrl: string
	botField: string
}

const initialFormState: FormState = {
	reporterAlias: '',
	reporterContact: '',
	suspectName: '',
	suspectPhone: '',
	transactionAmount: '',
	transactionDate: '',
	transactionReason: '',
	evidenceSummary: '',
	evidenceUrl: '',
	botField: ''
}

export function AntifraudDeskForm() {
	const [form, setForm] = useState<FormState>(initialFormState)
	const [status, setStatus] = useState<Status>('idle')
	const [error, setError] = useState<ErrorState>(null)

	const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setForm(current => ({ ...current, [name]: value }))
	}

	const resetForm = () => {
		setForm(initialFormState)
		setStatus('idle')
		setError(null)
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (status === 'submitting') return

		setStatus('submitting')
		setError(null)

		try {
			const response = await fetch('/api/antifraud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			})

			if (response.ok) {
				setStatus('success')
				setForm(initialFormState)
				return
			}

			if (response.status === 429) {
				setError('rate-limit')
			} else if (response.status === 422) {
				setError('validation')
			} else {
				setError('server')
			}
			setStatus('error')
		} catch (error_) {
			console.error('Antifraud submission failed', error_)
			setError('server')
			setStatus('error')
		}
	}

	if (status === 'success') {
		return (
			<div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-emerald-100 shadow-2xl">
				<div className="mb-6 flex items-center gap-3 text-emerald-200">
					<ShieldCheck className="h-6 w-6" />
					<h2 className="text-xl font-semibold">Thank you for protecting patients and the clinic.</h2>
				</div>
				<p className="mb-4 text-sm">
					Our admin team will cross-check the amount, name, date, and reason against official records. We&apos;ll reach out only if we need clarification.
				</p>
				<div className="flex flex-wrap gap-3">
					<button type="button" className="btn-primary" onClick={resetForm}>Send another report</button>
					<Link href="/" className="btn-outline">Return home</Link>
				</div>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur" noValidate>
			<div className="hidden" aria-hidden>
				<label className="sr-only" htmlFor="bot-field">Do not fill</label>
				<input
					id="bot-field"
					name="botField"
					type="text"
					tabIndex={-1}
					autoComplete="off"
					value={form.botField}
					onChange={handleChange}
					className="hidden"
				/>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<div className="form-field">
					<label className="form-label" htmlFor="reporterAlias">Alias or initials (optional)</label>
					<input
						id="reporterAlias"
						name="reporterAlias"
						className="form-input bg-slate-900/60 text-white placeholder:text-slate-500"
						placeholder="e.g. Concerned patient"
						value={form.reporterAlias}
						onChange={handleChange}
						autoComplete="nickname"
					/>
					<p className="form-hint">Leave blank to stay anonymous.</p>
				</div>
				<div className="form-field">
					<label className="form-label" htmlFor="reporterContact">Contact for follow-up (optional)</label>
					<input
						id="reporterContact"
						name="reporterContact"
						className="form-input bg-slate-900/60 text-white placeholder:text-slate-500"
						placeholder="Phone or email if we can update you"
						value={form.reporterContact}
						onChange={handleChange}
						autoComplete="off"
					/>
				</div>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<div className="form-field">
					<label className="form-label" htmlFor="suspectName">Staff member involved</label>
					<input
						id="suspectName"
						name="suspectName"
						className="form-input bg-slate-900/60 text-white placeholder:text-slate-500"
						placeholder="Name of clinician or employee"
						value={form.suspectName}
						onChange={handleChange}
						required
					/>
				</div>
				<div className="form-field">
					<label className="form-label" htmlFor="suspectPhone">Phone number used</label>
					<input
						id="suspectPhone"
						name="suspectPhone"
						className="form-input bg-slate-900/60 text-white placeholder:text-slate-500"
						placeholder="Phone number payments were sent to"
						value={form.suspectPhone}
						onChange={handleChange}
						autoComplete="tel"
						required
					/>
				</div>
			</div>

			<div className="grid gap-6 sm:grid-cols-3">
				<div className="form-field">
					<label className="form-label" htmlFor="transactionAmount">Exact amount paid (KES)</label>
					<input
						id="transactionAmount"
						name="transactionAmount"
						type="number"
						min="0"
						step="1"
						className="form-input bg-slate-900/60 text-white placeholder:text-slate-500"
						placeholder="e.g. 4500"
						value={form.transactionAmount}
						onChange={handleChange}
						required
					/>
				</div>
				<div className="form-field">
					<label className="form-label" htmlFor="transactionDate">Date of payment</label>
					<input
						id="transactionDate"
						name="transactionDate"
						type="date"
						className="form-input bg-slate-900/60 text-white placeholder:text-slate-500"
						value={form.transactionDate}
						onChange={handleChange}
						required
					/>
				</div>
				<div className="form-field">
					<label className="form-label" htmlFor="evidenceUrl">Evidence link (optional)</label>
					<input
						id="evidenceUrl"
						name="evidenceUrl"
						type="url"
						className="form-input bg-slate-900/60 text-white placeholder:text-slate-500"
						placeholder="Share drive link, photo URL, etc."
						value={form.evidenceUrl}
						onChange={handleChange}
					/>
				</div>
			</div>

			<div className="form-field">
				<label className="form-label" htmlFor="transactionReason">Reason you were asked to send to a phone number</label>
				<textarea
					id="transactionReason"
					name="transactionReason"
					className="form-textarea bg-slate-900/60 text-white placeholder:text-slate-500"
					rows={3}
					placeholder="Summarise the explanation the staff member gave."
					value={form.transactionReason}
					onChange={handleChange}
					required
				/>
			</div>

			<div className="form-field">
				<label className="form-label" htmlFor="evidenceSummary">What happened? Include any evidence you can describe.</label>
				<textarea
					id="evidenceSummary"
					name="evidenceSummary"
					className="form-textarea bg-slate-900/60 text-white placeholder:text-slate-500"
					rows={5}
					placeholder="Timeline, who was present, receipt numbers, or message excerpts—whatever helps us verify."
					value={form.evidenceSummary}
					onChange={handleChange}
					required
				/>
			</div>

			{error && (
				<div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
					{error === 'rate-limit' && 'You have sent several reports in a short time. Please wait a few minutes and try again.'}
					{error === 'validation' && 'Some details are missing or invalid. Double-check the form and try again.'}
					{error === 'server' && 'We could not save your report right now. Please try again shortly or call the clinic manager.'}
				</div>
			)}

			<div className="mt-6 flex flex-wrap items-center gap-4">
				<button type="submit" className="btn-primary" disabled={status === 'submitting'}>
					{status === 'submitting' ? 'Submitting…' : 'Submit confidential report'}
				</button>
				<p className="text-xs text-slate-400">
					Your IP address is stored for serious abuse investigations only. We never publish antifraud submissions.
				</p>
			</div>
		</form>
	)
}
