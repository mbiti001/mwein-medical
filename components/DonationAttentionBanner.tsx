"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const APPEAR_DELAY_MS = 60_000
const STORAGE_KEY = 'mwein-donation-banner-dismissed'

const hiddenPaths = new Set(['/donate'])

export default function DonationAttentionBanner() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  const shouldHideForPath = useMemo(() => {
    if (!pathname) return false
    for (const hiddenPath of hiddenPaths) {
      if (pathname.startsWith(hiddenPath)) {
        return true
      }
    }
    return false
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (shouldHideForPath) {
      setVisible(false)
      return
    }

    if (sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(false)
      return
    }

    const timer = window.setTimeout(() => {
      setVisible(true)
    }, APPEAR_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [shouldHideForPath, pathname])

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, new Date().toISOString())
    }
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <aside
      role="dialog"
      aria-live="assertive"
      aria-label="Donation support reminder"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white px-6 py-5 shadow-2xl ring-1 ring-primary/10">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full border border-transparent px-2 py-1 text-sm font-medium text-slate-500 transition hover:border-slate-200 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Dismiss donation reminder"
        >
          Close
        </button>
        <div className="space-y-2 pr-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Urgent care relies on community support</p>
          <h3 className="text-xl font-semibold text-slate-900">Help us cover critical referrals within the first hour</h3>
          <p className="text-base text-slate-600">
            Your gift keeps emergency transport, neonatal oxygen, and pediatric malaria treatment ready for families who arrive without funds. A few minutes from now, it could be their only safety net.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/donate" className="btn-primary">
              Donate now
            </Link>
            <Link href="/contact" className="btn-outline">
              Talk to our team
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            We only show this reminder once per session. Thank you for keeping Mungatsi families safe.
          </p>
        </div>
      </div>
    </aside>
  )
}
