"use client"

import { Suspense, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Incorrect email or password. Please try again.')
        } else {
          setError('Unable to sign in right now. Please try again soon.')
        }
        return
      }

      setEmail('')
      setPassword('')
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error('Login error', err)
      setError('Unexpected error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/60 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center space-y-3">
          <span className="badge bg-white/10 text-white">Admin access</span>
          <h1 className="text-3xl font-semibold text-white">Sign in to the dashboard</h1>
          <p className="text-sm text-slate-300">Enter the admin credentials configured in your environment.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-field">
            <label className="form-label text-white" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              className="form-input bg-slate-900/70 text-white border-slate-700 placeholder:text-slate-500"
              autoComplete="username"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label text-white" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="form-input bg-slate-900/70 text-white border-slate-700 placeholder:text-slate-500"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="form-error text-red-400">{error}</p>}
          <button
            type="submit"
            className="btn-primary w-full justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={(
        <section className="min-h-screen flex items-center justify-center bg-slate-900">
          <p className="text-slate-200">Loading login form…</p>
        </section>
      )}
    >
      <LoginPageInner />
    </Suspense>
  )
}
