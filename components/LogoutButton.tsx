"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleLogout() {
    setIsSigningOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Failed to sign out', error)
    } finally {
      setIsSigningOut(false)
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-primary hover:text-white disabled:opacity-50"
      disabled={isSigningOut}
    >
      {isSigningOut ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
