"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Gift, HeartHandshake, PartyPopper } from 'lucide-react'
import { triggerDonationCelebration } from './DonationCelebration'

const MPESA_TILL = '8121096'
const STORAGE_KEY = 'mwein-contribution-log'

type Channel = 'M-Pesa' | 'PayPal' | 'Cash/Other'
type ConsentState = 'pending' | 'granted' | 'declined'

type Contribution = {
  id: string
  firstName: string
  amount: number
  channel: Channel
  shareConsent: ConsentState
  timestamp: string
}

type FormState = {
  firstName: string
  amount: string
  channel: Channel
}

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0
})

const formatAmount = (amount: number) => currencyFormatter.format(Math.round(amount))

export default function DonateExperience() {
  const [copied, setCopied] = useState(false)
  const [acknowledgement, setAcknowledgement] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [pendingContributionId, setPendingContributionId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<FormState>({ firstName: '', amount: '', channel: 'M-Pesa' })
  const [formError, setFormError] = useState<string | null>(null)
  const logSectionRef = useRef<HTMLDivElement | null>(null)
  const ackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return
      const restored = parsed
        .filter((item): item is Contribution => {
          return (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.firstName === 'string' &&
            typeof item.amount === 'number' &&
            (item.channel === 'M-Pesa' || item.channel === 'PayPal' || item.channel === 'Cash/Other')
          )
        })
        .map(item => ({
          ...item,
          shareConsent: item.shareConsent === 'granted' || item.shareConsent === 'declined' ? item.shareConsent : 'pending'
        }))
      setContributions(restored)
    } catch (error) {
      console.error('Unable to restore contribution log', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contributions))
  }, [contributions])

  useEffect(() => {
    return () => {
      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current)
      }
    }
  }, [])

  const totals = useMemo(() => {
    const totalAmount = contributions.reduce((sum, entry) => sum + entry.amount, 0)
    const publicContributions = contributions.filter(entry => entry.shareConsent === 'granted')
    return {
      totalAmount,
      totalCount: contributions.length,
      publicContributions
    }
  }, [contributions])

  const pendingContribution = useMemo(() => {
    if (pendingContributionId) {
      return contributions.find(entry => entry.id === pendingContributionId)
    }
    return contributions.find(entry => entry.shareConsent === 'pending') || null
  }, [contributions, pendingContributionId])

  const setTimedAcknowledgement = (message: string, duration = 7000) => {
    setAcknowledgement(message)
    if (ackTimeoutRef.current) {
      clearTimeout(ackTimeoutRef.current)
    }
    ackTimeoutRef.current = setTimeout(() => setAcknowledgement(null), duration)
  }

  const promptLog = (channel: Channel) => {
    setFormValues(prev => ({ ...prev, channel }))
    setFormError(null)
    setTimedAcknowledgement('Let us thank you properly—add your first name and gift below.')
    logSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = formValues.firstName.trim()
    const amountNumber = parseFloat(formValues.amount)

    if (!trimmedName) {
      setFormError('Please share your first name so we can thank you personally.')
      return
    }

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setFormError('Enter a donation amount greater than zero in Kenyan Shillings.')
      return
    }

    try {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`
      const newContribution: Contribution = {
        id,
        firstName: trimmedName,
        amount: Math.round(amountNumber),
        channel: formValues.channel,
        shareConsent: 'pending',
        timestamp: new Date().toISOString()
      }

      setContributions(prev => [newContribution, ...prev])
      setPendingContributionId(newContribution.id)
      triggerDonationCelebration()
      setTimedAcknowledgement(`Thank you, ${trimmedName}! Your ${formValues.channel} gift is already making an impact.`)
      setFormValues(prev => ({ ...prev, firstName: '', amount: '' }))
      setFormError(null)
    } catch (error) {
      console.error('Unable to log contribution', error)
      setFormError('We could not log your gift right now. Please try again or WhatsApp the clinic.')
    }
  }

  const handleConsent = (response: Exclude<ConsentState, 'pending'>) => {
    if (!pendingContribution) return

    setContributions(prev =>
      prev.map(entry =>
        entry.id === pendingContribution.id
          ? {
              ...entry,
              shareConsent: response
            }
          : entry
      )
    )

    const name = pendingContribution.firstName
    if (response === 'granted') {
      setTimedAcknowledgement(`We'll celebrate you on our gratitude wall, ${name}!`)
    } else {
      setTimedAcknowledgement(`We'll keep your gift private, ${name}. Thank you for the trust.`)
    }

    setPendingContributionId(null)
  }

  const copyTillNumber = async () => {
    try {
      await navigator.clipboard.writeText(MPESA_TILL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Unable to copy till number', error)
    }
  }

  const latestPublic = totals.publicContributions.slice(0, 6)

  return (
    <section className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/90 via-primary to-sky-500 px-6 py-10 text-white shadow-2xl sm:px-10">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
            <HeartHandshake className="h-4 w-4" />
            Community-powered healthcare
          </span>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Your generosity keeps emergency care within reach.</h2>
          <p className="text-base text-white/90 sm:text-lg">
            Every shilling you contribute becomes oxygen for tiny lungs, antibiotics for severe pneumonia, or a night of safe recovery for a mother facing postpartum complications.
          </p>
          <p className="text-sm text-white/80">
            Thanks to supporters like you, we mobilize referral ambulances within minutes, stock neonatal warmers, and subsidize lifesaving treatment when families arrive without cash.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => promptLog('Cash/Other')}
              className="btn-primary bg-white text-primary shadow-xl hover:bg-white/80"
            >
              <PartyPopper className="h-4 w-4" />
              I just donated!
            </button>
            <Link
              href="https://wa.me/254707711888"
              target="_blank"
              rel="noreferrer"
              className="btn-outline border-white/60 bg-white/10 text-white hover:border-white hover:bg-white/20"
            >
              Talk to our finance team
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full bg-sky-200/40 blur-3xl" aria-hidden />
      </div>

      {acknowledgement && (
        <div className="card border-primary/30 bg-primary/5 text-primary">
          <p className="flex items-center gap-2 font-semibold">
            <PartyPopper className="h-5 w-5" />
            {acknowledgement}
          </p>
          <p className="text-sm text-primary/80">We just launched balloons and stars in your honour!</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Why your donation matters</h3>
            <ul className="grid gap-3 text-slate-600 sm:grid-cols-2">
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-3 shadow-sm">
                <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                  1
                </span>
                <p className="text-sm">
                  Mothers who need urgent ambulance transfers hours after birth no longer delay because of the bill.
                </p>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-3 shadow-sm">
                <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                  2
                </span>
                <p className="text-sm">
                  Newborns receive incubator warmth, oxygen, and antibiotics while parents rally support.
                </p>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-3 shadow-sm">
                <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                  3
                </span>
                <p className="text-sm">
                  Children battling severe malaria or pneumonia access medication immediately—not after fundraising.
                </p>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-3 shadow-sm">
                <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                  4
                </span>
                <p className="text-sm">
                  Emergency consumables like sterile kits, IV fluids, and rapid tests stay stocked for any hour.
                </p>
              </li>
            </ul>
          </div>

          <div className="card space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">What your gift unlocks</h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <Gift className="mt-1 h-5 w-5 text-primary" />
                <p>Subsidized bills for emergency deliveries, neonatal admissions, and overnight monitoring.</p>
              </li>
              <li className="flex items-start gap-3">
                <Gift className="mt-1 h-5 w-5 text-primary" />
                <p>Immediate referral transport when minutes matter for critical cases.</p>
              </li>
              <li className="flex items-start gap-3">
                <Gift className="mt-1 h-5 w-5 text-primary" />
                <p>Child-friendly formulations of antimalarials, antibiotics, and oxygen supplies ready for use.</p>
              </li>
              <li className="flex items-start gap-3">
                <Gift className="mt-1 h-5 w-5 text-primary" />
                <p>Community outreach clinics with stocked consumables for remote villages.</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div ref={logSectionRef} className="card space-y-5 border-primary/40 bg-white shadow-lg">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Log your donation</h3>
                <p className="text-sm text-slate-600">We celebrate every gift. Share your first name and amount so we can thank you personally.</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total logged</p>
                <p className="text-2xl font-semibold text-primary">{formatAmount(totals.totalAmount)}</p>
                <p className="text-xs text-slate-500">{totals.totalCount} supporter{totals.totalCount === 1 ? '' : 's'}</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">First name</span>
                <input
                  type="text"
                  value={formValues.firstName}
                  onChange={event => setFormValues(prev => ({ ...prev, firstName: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Amina"
                  required
                />
              </label>
              <label className="sm:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount (KES)</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  inputMode="numeric"
                  value={formValues.amount}
                  onChange={event => setFormValues(prev => ({ ...prev, amount: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 1000"
                  required
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</span>
                <select
                  value={formValues.channel}
                  onChange={event => setFormValues(prev => ({ ...prev, channel: event.target.value as Channel }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="M-Pesa">M-Pesa Till {MPESA_TILL}</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash/Other">Cash / Other</option>
                </select>
              </label>
              {formError && (
                <p className="sm:col-span-2 text-sm font-medium text-rose-500">{formError}</p>
              )}
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button type="submit" className="btn-primary">
                  <PartyPopper className="h-4 w-4" />
                  Log my donation
                </button>
                <button
                  type="button"
                  onClick={() => setFormValues({ firstName: '', amount: '', channel: 'M-Pesa' })}
                  className="btn-outline"
                >
                  Clear form
                </button>
              </div>
            </form>

            {latestPublic.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700">Gratitude wall</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {latestPublic.map(entry => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-800">{entry.firstName}</span>
                      <span className="text-xs uppercase tracking-wide text-slate-500">{entry.channel}</span>
                      <span className="font-semibold text-primary">{formatAmount(entry.amount)}</span>
                    </li>
                  ))}
                </ul>
                {totals.publicContributions.length > latestPublic.length && (
                  <p className="mt-2 text-xs text-slate-500">{totals.publicContributions.length - latestPublic.length} more supporter{totals.publicContributions.length - latestPublic.length === 1 ? '' : 's'} honoured privately.</p>
                )}
              </div>
            )}
          </div>

          {pendingContribution && (
            <div className="card border-dashed border-primary/40 bg-primary/5 text-primary">
              <p className="text-sm font-semibold">Thank you, {pendingContribution.firstName}! May we list your gift of {formatAmount(pendingContribution.amount)}?</p>
              <p className="text-xs text-primary/80">We only display first names and channels on the gratitude wall.</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" onClick={() => handleConsent('granted')} className="btn-primary">
                  Yes, celebrate it
                </button>
                <button type="button" onClick={() => handleConsent('declined')} className="btn-outline">
                  No, keep it private
                </button>
              </div>
            </div>
          )}

          <div className="card space-y-4 border-primary/30 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">M-Pesa Till</h3>
                <p className="text-sm text-slate-600">Business Till <strong>{MPESA_TILL}</strong></p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Instant support
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Share the confirmation SMS with our team for an official receipt. Need help? WhatsApp{' '}
              <a href="https://wa.me/254707711888" className="text-primary">+254 707 711 888</a>.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={copyTillNumber} className="btn-outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Till number'}
              </button>
              <button type="button" onClick={() => promptLog('M-Pesa')} className="btn-primary">
                <PartyPopper className="h-4 w-4" />
                Log my M-Pesa gift
              </button>
            </div>
          </div>

          <div className="card space-y-4 border-slate-200/80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">PayPal</h3>
                <p className="text-sm text-slate-600">paypal.me/mweinmedical</p>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600">
                Global friends
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Prefer PayPal? Send to <strong>mweinmedical@gmail.com</strong> or use the button below—every international gift fills critical gaps.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.paypal.com/paypalme/mweinmedical"
                target="_blank"
                rel="noreferrer"
                onClick={() => promptLog('PayPal')}
                className="btn-primary"
              >
                Donate with PayPal
              </a>
              <button type="button" onClick={() => promptLog('PayPal')} className="btn-outline">
                <PartyPopper className="h-4 w-4" />
                Log my PayPal gift
              </button>
            </div>
          </div>

          <div className="card space-y-3 border-slate-200/80">
            <h3 className="text-lg font-semibold text-slate-900">Need a custom pledge?</h3>
            <p className="text-sm text-slate-600">
              Email <a href="mailto:mweinmedical@gmail.com" className="text-primary">mweinmedical@gmail.com</a> and we&rsquo;ll send bank details, pledges forms, or corporate partnership options.
            </p>
            <p className="text-xs text-slate-500">We are grateful for every supporter investing in Mungatsi&rsquo;s health.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
