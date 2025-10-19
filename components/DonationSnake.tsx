"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import type { SupporterSnapshot, TotalsSnapshot } from '../lib/donations'

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0
})

const numberFormatter = new Intl.NumberFormat('en-KE')

const placeholders: Array<Pick<SupporterSnapshot, 'id' | 'firstName' | 'totalAmount' | 'donationCount'>> = [
  { id: 'placeholder-1', firstName: 'Grace', totalAmount: 2500, donationCount: 1 },
  { id: 'placeholder-2', firstName: 'Amina', totalAmount: 1800, donationCount: 2 },
  { id: 'placeholder-3', firstName: 'Brian', totalAmount: 3200, donationCount: 1 },
  { id: 'placeholder-4', firstName: 'Naliaka', totalAmount: 1500, donationCount: 3 },
  { id: 'placeholder-5', firstName: 'Wanjiru', totalAmount: 2100, donationCount: 1 },
  { id: 'placeholder-6', firstName: 'Mutua', totalAmount: 4000, donationCount: 2 }
]

type SupporterPayload = {
  supporters: SupporterSnapshot[]
  totals: TotalsSnapshot
}

type TrailEntry = {
  id: string
  label: string
  amountLabel: string
  meta: string
  badge: string
}

export default function DonationSnake() {
  const [supporters, setSupporters] = useState<SupporterSnapshot[]>([])
  const [totals, setTotals] = useState<TotalsSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadSupporters = async () => {
      try {
        const response = await fetch('/api/donations/supporters', {
          headers: { 'cache-control': 'no-store' }
        })

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`)
        }

        const payload: SupporterPayload = await response.json()
        if (!cancelled) {
          setSupporters(payload.supporters)
          setTotals(payload.totals)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load donation snake data', err)
          setSupporters([])
          setError('We are refreshing supporter highlights shortly.')
        }
      }
    }

    loadSupporters()

    const interval = window.setInterval(loadSupporters, 60000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const trailEntries = useMemo(() => {
    const publicSupporters = supporters.filter(entry => entry.publicAcknowledgement)
    const source = publicSupporters.length > 0 ? publicSupporters.slice(0, 8) : placeholders

    return source.map((entry, index): TrailEntry => {
      const amount = currencyFormatter.format(Math.round(entry.totalAmount))
      const badge = index % 3 === 0 ? 'Emergency care' : index % 3 === 1 ? 'Waived fees' : 'Ready ambulances'
      const donationLabel = entry.donationCount > 1 ? `${entry.donationCount} gifts logged` : 'First gift logged'

      return {
        id: entry.id,
        label: `${entry.firstName} keeps care within reach`,
        amountLabel: amount,
        meta: donationLabel,
        badge
      }
    })
  }, [supporters])

  return (
    <section className="section-spacing donation-snake" aria-labelledby="donation-snake-heading">
      <div className="intro">
        <span className="eyebrow">Community gratitude trail</span>
        <h2 id="donation-snake-heading">Supporters fuel lifesaving care every single week</h2>
        <p className="lede">
          Every waiver is screened inside the clinic before it is approved, then logged in our internal cost-waiver ledger so we can issue transparent impact summaries to supporters on demand.
        </p>
        <div className="stats" aria-live="polite">
          <div>
            <p className="stat-label">Supporters rallied</p>
            <p className="stat-value">{totals ? numberFormatter.format(totals.totalSupporters) : '—'}</p>
          </div>
          <div>
            <p className="stat-label">Care funded this year</p>
            <p className="stat-value">{totals ? currencyFormatter.format(Math.round(totals.totalAmount)) : '—'}</p>
          </div>
          <div>
            <p className="stat-label">Waivers logged</p>
            <p className="stat-value">{totals ? numberFormatter.format(totals.totalGifts) : '—'}</p>
          </div>
        </div>
        <p className="fine-print">
          Need a summary for your records? Email <a href="mailto:supporters@mweinmedical.co.ke">supporters@mweinmedical.co.ke</a> and we will generate the latest waiver and donation report.
        </p>
      </div>

      <div className="trail" role="list">
        {trailEntries.map((entry, index) => (
          <article
            key={entry.id}
            role="listitem"
            className={`stop ${index % 2 === 0 ? 'stop-left' : 'stop-right'}`}
            aria-label={`${entry.label}. ${entry.amountLabel}. ${entry.meta}.`}
          >
            <div className="node">
              <span className="badge">{entry.badge}</span>
              <h3>{entry.label}</h3>
              <p className="amount">{entry.amountLabel}</p>
              <p className="meta">{entry.meta}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="cta">
        <Link href="/donate" className="btn-primary">Add your name to the trail</Link>
        <Link href="/contact" className="btn-outline">Talk to our finance desk</Link>
      </div>

      {error && <p className="error" role="status">{error}</p>}

      <style jsx>{`
        .donation-snake {
          background: linear-gradient(180deg, rgba(239, 246, 255, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
          border-radius: 2rem;
          padding-top: 3rem;
          padding-bottom: 3rem;
          margin-top: 1rem;
        }

        .intro {
          display: grid;
          gap: 1rem;
          text-align: center;
          max-width: 768px;
          margin: 0 auto;
        }

        .eyebrow {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0284c7;
        }

        .lede {
          font-size: 0.95rem;
          color: #334155;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          padding: 1.2rem;
          border-radius: 1.5rem;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(14, 165, 233, 0.15);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
        }

        .stats div {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0ea5e9;
        }

        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
        }

        .fine-print {
          font-size: 0.82rem;
          color: #475569;
        }

        .fine-print a {
          color: #0284c7;
          text-decoration: underline;
        }

        .trail {
          position: relative;
          margin: 3rem auto 2.5rem;
          display: grid;
          gap: 1.5rem;
        }

        .trail::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, rgba(14, 165, 233, 0.55) 0%, rgba(14, 165, 233, 0) 90%);
          transform: translateX(-50%);
          opacity: 0;
        }

        .stop {
          position: relative;
          list-style: none;
          display: flex;
          justify-content: center;
          text-align: left;
        }

        .node {
          position: relative;
          background: #ffffff;
          border-radius: 1.5rem;
          padding: 1.25rem 1.5rem;
          border: 1px solid rgba(14, 165, 233, 0.18);
          box-shadow: 0 10px 24px rgba(30, 64, 175, 0.12);
          max-width: 320px;
          width: 100%;
        }

        .node h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 0.4rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          background: rgba(14, 165, 233, 0.12);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #0284c7;
          margin-bottom: 0.5rem;
        }

        .amount {
          font-weight: 700;
          color: #0ea5e9;
          font-size: 1rem;
        }

        .meta {
          font-size: 0.85rem;
          color: #475569;
        }

        .stop::after {
          content: '';
          position: absolute;
          top: 34px;
          width: 28px;
          height: 2px;
          background: rgba(14, 165, 233, 0.4);
          opacity: 0;
        }

        .stop-left::after {
          right: calc(50% - 14px);
        }

        .stop-right::after {
          left: calc(50% - 14px);
        }

        .stop-left {
          justify-self: flex-start;
        }

        .stop-right {
          justify-self: flex-end;
        }

        .cta {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          margin-top: 0;
        }

        .error {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.85rem;
          color: #b91c1c;
        }

        @media (min-width: 640px) {
          .donation-snake {
            padding-top: 3.5rem;
            padding-bottom: 3.5rem;
          }
        }

        @media (min-width: 768px) {
          .trail {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 2.5rem 1rem;
            padding: 0 1rem;
          }

          .trail::before {
            opacity: 1;
          }

          .stop::after {
            opacity: 1;
          }

          .node {
            max-width: 360px;
          }
        }

        @media (min-width: 1024px) {
          .donation-snake {
            padding-left: 3rem;
            padding-right: 3rem;
          }
        }

        @media (max-width: 639px) {
          .stats {
            grid-template-columns: 1fr;
          }

          .trail {
            margin-top: 2rem;
            gap: 1.25rem;
          }

          .stop::after {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}
