"use client"

import { useEffect, useState } from 'react'

export function triggerDonationCelebration() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('donation:celebrate'))
}

export default function DonationCelebration() {
  const [active, setActive] = useState(false)
  const [celebrationKey, setCelebrationKey] = useState(0)

  const trainSegments = [
    {
      icon: '🚑',
      label: 'Emergency care funded',
      accent: 'rgba(34, 197, 94, 0.18)'
    },
    {
      icon: '💉',
      label: 'Medicines restocked',
      accent: 'rgba(20, 184, 166, 0.18)'
    },
    {
      icon: '🌈',
      label: 'Families out of danger',
      accent: 'rgba(250, 204, 21, 0.22)'
    }
  ]

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = () => {
      setCelebrationKey(previous => previous + 1)
      setActive(true)
      window.setTimeout(() => setActive(false), 8000)
    }

    window.addEventListener('donation:celebrate', handler as EventListener)

    return () => {
      window.removeEventListener('donation:celebrate', handler as EventListener)
    }
  }, [])

  if (!active) return null

  return (
    <div className="celebration-overlay pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      <div className="celebration-track">
        <div key={celebrationKey} className="celebration-train" role="status" aria-live="assertive">
          {trainSegments.map(segment => (
            <span key={segment.label} className="celebration-car" style={{ backgroundColor: segment.accent }}>
              <span aria-hidden>{segment.icon}</span>
              <span className="celebration-car-label">{segment.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
