"use client"

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const tokenMissing = token.length === 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.')
      return
    }

    if (!token) {
      setError('Reset link is missing or invalid. Request a new email.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      })

      if (!response.ok) {
        if (response.status === 400) {
          setError('Your reset link is invalid or expired. Please request a new one.')
        } else {
          setError('We could not reset the password right now. Try again shortly.')
        }
        return
      }

      setSuccess('Password updated. You can now sign in with your new credentials.')
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        router.push('/login')
      }, 1200)
    } catch (err) {
      console.error('Reset password error', err)
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
          <h1 className="text-3xl font-semibold text-white">Reset your admin password</h1>
          <p className="text-sm text-slate-300">
            Use the secure link emailed to <span className="font-semibold text-white">mweinmedical@gmail.com</span>. Password managers can save the new credentials automatically.
          </p>
        </div>

        {tokenMissing ? (
          <div className="space-y-4 text-slate-200">
            <p className="text-sm">
              This reset link is missing key information. Request a fresh email from the login screen to continue.
            </p>
            <Link href="/login" className="btn-outline w-full justify-center text-white">
              Return to sign-in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div className="form-field">
              <label className="form-label text-white" htmlFor="reset-email">Admin email</label>
              <input
                id="reset-email"
                className="form-input bg-slate-900/70 text-white border-slate-700 placeholder:text-slate-500"
                type="email"
                autoComplete="username"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label text-white" htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                className="form-input bg-slate-900/70 text-white border-slate-700 placeholder:text-slate-500"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                minLength={12}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label text-white" htmlFor="reset-password-confirm">Confirm password</label>
              <input
                id="reset-password-confirm"
                className="form-input bg-slate-900/70 text-white border-slate-700 placeholder:text-slate-500"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                minLength={12}
                required
              />
            </div>

            {error && <p className="form-error text-red-400">{error}</p>}
            {success && <p className="text-sm font-medium text-emerald-300">{success}</p>}

            <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
              {submitting ? 'Updating…' : 'Save new password'}
            </button>
            <p className="text-center text-xs text-slate-400">
              Prefer to sign in later? <Link href="/login" className="underline">Return to login</Link>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
