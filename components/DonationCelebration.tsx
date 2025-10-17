"use client"

import { useEffect, useState } from 'react'

type Shape = {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  color: string
  kind: 'star' | 'balloon'
}

const COLORS = ['#60a5fa', '#38bdf8', '#facc15', '#f472b6', '#34d399']

export function triggerDonationCelebration() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('donation:celebrate'))
}

export default function DonationCelebration() {
  const [active, setActive] = useState(false)
  const [shapes, setShapes] = useState<Shape[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const createShapes = (): Shape[] =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 5.5 + Math.random() * 3,
        size: 20 + Math.random() * 26,
        color: COLORS[index % COLORS.length],
        kind: index % 3 === 0 ? 'balloon' : 'star'
      }))

    const handler = () => {
      setShapes(createShapes())
      setActive(true)
      window.setTimeout(() => setActive(false), 6000)
    }

    window.addEventListener('donation:celebrate', handler as EventListener)

    return () => {
      window.removeEventListener('donation:celebrate', handler as EventListener)
    }
  }, [])

  if (!active) return null

  return (
    <div className="celebration-overlay pointer-events-none fixed inset-0 z-[60]">
      {shapes.map((shape) => (
        <span
          key={`${shape.id}-${shape.left.toFixed(2)}`}
          className={`celebration-shape ${
            shape.kind === 'star' ? 'celebration-star' : 'celebration-balloon'
          }`}
          style={{
            left: `${shape.left}%`,
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
            width: `${shape.size}px`,
            height:
              shape.kind === 'star'
                ? `${shape.size}px`
                : `${Math.round(shape.size * 1.35)}px`,
            backgroundColor: shape.color
          }}
        />
      ))}
    </div>
  )
}
