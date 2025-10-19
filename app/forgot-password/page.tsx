"use client"

import { FormEvent, useState } from 'react'
import Link from 'next/link'

const DEFAULT_EMAIL = 'mweinmedical@gmail.com'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [status, setStatus] = useState<'idle' | 'submitted'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        if (response.status === 400) {
          setError('Please provide a valid email address.')
        } else {
          setError('We could not start the reset process right now. Try again shortly.')
        }
        return
      }

      setStatus('submitted')
    } catch (err) {
      console.error('Forgot password error', err)
      setError('Unexpected error. Please try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/60 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center space-y-3">
          <span className="badge bg-white/10 text-white">Admin access</span>
          <h1 className="text-3xl font-semibold text-white">Request a reset link</h1>
          <p className="text-sm text-slate-300">
            We will email <span className="font-semibold text-white">mweinmedical@gmail.com</span> with a one-time password reset link.
          </p>
        </div>

        {status === 'submitted' ? (
          <div className="space-y-4 text-center text-slate-200">
            <p className="text-sm">
              Check the inbox for <span className="font-semibold">{email}</span>. The reset link expires in 30 minutes and can be saved directly into your password manager.
            </p>
            <Link href="/login" className="btn-primary w-full justify-center">Return to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div className="form-field">
              <label className="form-label text-white" htmlFor="forgot-email">Admin email</label>
              <input
                id="forgot-email"
                className="form-input bg-slate-900/70 text-white border-slate-700 placeholder:text-slate-500"
                type="email"
                autoComplete="username"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
              <p className="mt-2 text-xs text-slate-400">Only clinic administrators should receive this link.</p>
            </div>

            {error && <p className="form-error text-red-400">{error}</p>}

            <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
              {submitting ? 'Sending…' : 'Email reset link'}
            </button>
            <p className="text-center text-xs text-slate-400">
              Already have the link? <Link href="/reset-password" className="underline">Open reset form</Link>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
