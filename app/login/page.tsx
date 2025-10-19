"use client"

import { Suspense, useState, FormEvent } from 'react'
import Link from 'next/link'
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

    console.log('🔐 Login attempt:', { email, passwordLength: password.length })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      console.log('📡 Login response:', response.status, response.statusText)

      const responseData = await response.text()
      console.log('📋 Response data:', responseData)

      if (!response.ok) {
        console.error('❌ Login failed:', response.status, responseData)
        if (response.status === 401) {
          setError('Incorrect email or password. Please try again.')
        } else {
          setError('Unable to sign in right now. Please try again soon.')
        }
        return
      }

      console.log('✅ Login successful, redirecting to:', redirectTo)
      setEmail('')
      setPassword('')
      
      // Force a page reload to ensure session is properly recognized
      window.location.href = redirectTo
      
    } catch (err) {
      console.error('💥 Login error:', err)
      setError('Unexpected error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/60 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center space-y-3">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-white/10 text-white rounded-full">Admin access</span>
          <h1 className="text-3xl font-semibold text-white">Sign in to the dashboard</h1>
          <p className="text-sm text-slate-300">Enter the admin credentials configured in your environment.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              className="w-full px-3 py-2 bg-slate-900/70 text-white border border-slate-700 rounded-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="username"
              type="email"
              placeholder="admin@mweinmedical.co.ke"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="w-full px-3 py-2 bg-slate-900/70 text-white border border-slate-700 rounded-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="current-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
          </div>
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password" className="text-sm font-medium text-sky-300 hover:text-sky-200 underline underline-offset-4">
            Forgot password?
          </Link>
          <p className="text-xs text-slate-400">
            Test credentials: admin@mweinmedical.co.ke / AdminPassword123!
          </p>
        </div>
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
