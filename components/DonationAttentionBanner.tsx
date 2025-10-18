"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'mwein-donation-banner-dismissed'
const DISPLAY_DURATION_MS = 60_000
const hiddenPaths = new Set(['/donate'])

export default function DonationAttentionBanner() {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [pauseTicker, setPauseTicker] = useState(false)
  const [cycleKey, setCycleKey] = useState(0)

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
    setDismissed(Boolean(sessionStorage.getItem(STORAGE_KEY)))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (shouldHideForPath || dismissed) {
      setVisible(false)
      setContainer((current) => {
        current?.remove()
        return null
      })
      return
    }

    const main = document.querySelector('main')
    if (!main) return

    const heading = main.querySelector('h1')
    const mountNode = document.createElement('div')
    mountNode.className = 'mt-4 print:hidden'

    if (heading && heading.parentElement) {
      heading.insertAdjacentElement('afterend', mountNode)
    } else {
      main.insertBefore(mountNode, main.firstChild)
    }

    setContainer(mountNode)
    setVisible(true)

    return () => {
      mountNode.remove()
      setContainer((current) => (current === mountNode ? null : current))
      setVisible(false)
    }
  }, [shouldHideForPath, dismissed, pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!visible) return

    setPauseTicker(false)

    const timer = window.setTimeout(() => {
      setPauseTicker(true)
    }, DISPLAY_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [visible, cycleKey])

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, new Date().toISOString())
    }
    setDismissed(true)
    if (container) {
      container.remove()
      setContainer(null)
    }
    setVisible(false)
  }

  const restartTicker = () => {
    setPauseTicker(false)
    setCycleKey((current) => current + 1)
  }

  if (!container || !visible || dismissed) {
    return null
  }

  return createPortal(
    <aside
      role="complementary"
      aria-live="polite"
      aria-label="Ways your donation keeps emergency care ready"
      className="rounded-2xl border border-primary/20 bg-white/90 px-5 py-4 shadow-lg ring-1 ring-primary/10"
    >
      <div className="sr-only">
        Emergency referrals rely on community generosity. Donate now to keep transport, neonatal oxygen, and pediatric malaria treatment available for families in crisis.
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Urgent care relies on community support
          </p>
          <div className="flex items-center gap-2">
            {pauseTicker ? (
              <button
                type="button"
                onClick={restartTicker}
                className="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary transition hover:border-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Replay message
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-500">Running for one minute…</span>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-200 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Close
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-r from-white to-primary/5">
          <div
            key={cycleKey}
            className="donation-marquee flex items-center gap-10 whitespace-nowrap px-4 py-2 text-sm text-slate-700"
            style={{ animationPlayState: pauseTicker ? 'paused' : 'running' }}
          >
            <span className="font-medium text-slate-900">
              Every KES 1,000 keeps neonatal oxygen flowing for premature babies in Mungatsi.
            </span>
            <span aria-hidden="true" className="font-medium text-slate-900">
              Your support fuels emergency transport and pediatric malaria treatment when families arrive without funds.
            </span>
            <span aria-hidden="true" className="font-medium text-slate-900">
              Donate securely via M-Pesa Till 8121096 or online today. Thank you for being the safety net.
            </span>
            <span aria-hidden="true" className="font-medium text-slate-900">
              Emergency referrals rely on community generosity—every contribution keeps care within the golden hour.
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/donate" className="btn-primary">
            Donate now
          </Link>
          <Link href="/contact" className="btn-outline">
            Talk to our team
          </Link>
        </div>
      </div>
    </aside>,
    container
  )
}
