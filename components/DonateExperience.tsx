"use client"

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Gift, HeartHandshake, PartyPopper } from 'lucide-react'
import DonationRail, { type DonationItem as DonationRailItem } from './DonationRail'
import { triggerDonationCelebration } from './DonationCelebration'

const MPESA_TILL = process.env.NEXT_PUBLIC_MPESA_TILL ?? '8121096'
const VISITOR_SESSION_KEY = 'mwein-donation-visitor-counted'

type Channel = 'M-Pesa' | 'PayPal' | 'Cash/Other'
type ConsentState = 'pending' | 'granted' | 'declined'

type SupporterSnapshot = {
  id: string
  firstName: string
  totalAmount: number
  donationCount: number
  lastChannel: Channel | null
  lastContributionAt: string | null
  publicAcknowledgement: boolean
}

type SupporterTrendPoint = {
  date: string
  newSupporters: number
}

type SupporterTotals = {
  totalAmount: number
  totalGifts: number
  totalSupporters: number
  publicSupporters: number
  activeSupporters: number
  newSupporters: number
}

type SupporterResponse = {
  supporters: SupporterSnapshot[]
  totals: SupporterTotals
  recentNewSupporters: SupporterTrendPoint[]
}

type PendingShare = {
  supporterId: string
  firstName: string
  amount: number
}

type FormState = {
  firstName: string
  amount: string
  channel: Channel
  phone: string
}

type MpesaStage = 'idle' | 'initiating' | 'pending' | 'success' | 'failed'
type MpesaTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0
})

const numberFormatter = new Intl.NumberFormat('en-KE')
const shortDateFormatter = new Intl.DateTimeFormat('en-KE', {
  month: 'short',
  day: 'numeric'
})
const paceFormatter = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 1
})
const longDateFormatter = new Intl.DateTimeFormat('en-KE', {
  dateStyle: 'medium'
})

const formatAmount = (amount: number) => currencyFormatter.format(Math.round(amount))
const formatTrendDate = (date: string) => shortDateFormatter.format(new Date(`${date}T00:00:00Z`))
const maskPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 9) {
    const local = digits.slice(-9)
    const formatted = `0${local}`.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
    return formatted
  }
  return value
}
const formatRelativeTimeLabel = (isoString: string | null) => {
  if (!isoString) return null
  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) return null

  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return longDateFormatter.format(parsed)
}

export default function DonateExperience() {
  const [copied, setCopied] = useState(false)
  const [acknowledgement, setAcknowledgement] = useState<string | null>(null)
  const [supporters, setSupporters] = useState<SupporterSnapshot[]>([])
  const [supporterTrend, setSupporterTrend] = useState<SupporterTrendPoint[]>([])
  const [supporterTotals, setSupporterTotals] = useState<SupporterTotals>({
    totalAmount: 0,
    totalGifts: 0,
    totalSupporters: 0,
    publicSupporters: 0,
    activeSupporters: 0,
    newSupporters: 0
  })
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null)
  const [selectedTrendIndex, setSelectedTrendIndex] = useState<number | null>(null)
  const [pendingShare, setPendingShare] = useState<PendingShare | null>(null)
  const [formValues, setFormValues] = useState<FormState>({ firstName: '', amount: '', channel: 'M-Pesa', phone: '' })
  const [mpesaStage, setMpesaStage] = useState<MpesaStage>('idle')
  const [mpesaTransactionId, setMpesaTransactionId] = useState<string | null>(null)
  const [mpesaError, setMpesaError] = useState<string | null>(null)
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [visitorCount, setVisitorCount] = useState<number | null>(null)
  const [hasCountedVisitor, setHasCountedVisitor] = useState(false)
  const [visitorLoading, setVisitorLoading] = useState(false)
  const [visitorError, setVisitorError] = useState<string | null>(null)
  const [supporterLoading, setSupporterLoading] = useState(false)
  const [supporterError, setSupporterError] = useState<string | null>(null)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [consentSubmitting, setConsentSubmitting] = useState(false)
  const logSectionRef = useRef<HTMLDivElement | null>(null)
  const ackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mpesaStartRef = useRef<number | null>(null)
  const mpesaPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearMpesaPolling = useCallback(() => {
    if (mpesaPollRef.current) {
      clearInterval(mpesaPollRef.current)
      mpesaPollRef.current = null
    }
  }, [])

  const resetMpesaState = useCallback(
    (options: { preservePhone?: boolean } = {}) => {
      clearMpesaPolling()
      mpesaStartRef.current = null
      setMpesaStage('idle')
      setMpesaTransactionId(null)
      setMpesaError(null)
      setMpesaReceipt(null)
      if (!options.preservePhone) {
        setFormValues(prev => ({ ...prev, phone: '' }))
      }
    },
    [clearMpesaPolling]
  )

  const resetDonationForm = useCallback(() => {
    setFormValues({ firstName: '', amount: '', channel: 'M-Pesa', phone: '' })
    setFormError(null)
    resetMpesaState({ preservePhone: false })
  }, [resetMpesaState])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setHasCountedVisitor(Boolean(sessionStorage.getItem(VISITOR_SESSION_KEY)))
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadVisitorCount = async () => {
      try {
        const response = await fetch('/api/metrics/visitors', { headers: { 'cache-control': 'no-store' } })
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`)
        }
        const payload: { count?: number } = await response.json()
        if (!cancelled) {
          setVisitorCount(typeof payload.count === 'number' ? payload.count : 0)
          setVisitorError(null)
        }
      } catch (error) {
        console.error('Unable to load visitor count', error)
        if (!cancelled) {
          setVisitorError('We will update the crowd size shortly.')
        }
      }
    }

    loadVisitorCount()

    return () => {
      cancelled = true
    }
  }, [])
  const loadSupporters = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!silent) {
        setSupporterLoading(true)
      }

      try {
        const response = await fetch('/api/donations/supporters', {
          headers: { 'cache-control': 'no-store' },
          signal
        })

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`)
        }

        const payload: SupporterResponse = await response.json()
        setSupporters(payload.supporters)
    setSupporterTotals(payload.totals)
    setSupporterTrend(payload.recentNewSupporters)
        setSupporterError(null)
      } catch (error) {
        if ((error as Error).name === 'AbortError' || signal?.aborted) {
          return
        }
        console.error('Unable to load supporters', error)
        setSupporterError('We are fetching the gratitude wall—please try again shortly.')
      } finally {
        if (!silent && !signal?.aborted) {
          setSupporterLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    const controller = new AbortController()
    loadSupporters(controller.signal).catch(error => {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to prime supporters', error)
      }
    })

    return () => {
      controller.abort()
    }
  }, [loadSupporters])

  useEffect(() => {
    const interval = setInterval(() => {
      loadSupporters(undefined, true).catch(error => {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to refresh supporters', error)
        }
      })
    }, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [loadSupporters])

  useEffect(() => {
    return () => {
      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => () => clearMpesaPolling(), [clearMpesaPolling])

  const publicSupporters = useMemo(() => supporters.filter(entry => entry.publicAcknowledgement), [supporters])
  const latestPublic = useMemo(() => publicSupporters.slice(0, 6), [publicSupporters])
  const donationRailItems = useMemo<DonationRailItem[]>(() => {
    if (publicSupporters.length === 0) {
      return []
    }

    return publicSupporters.slice(0, 24).map(entry => {
      const messageParts: string[] = []
      if (entry.lastChannel) {
        messageParts.push(entry.lastChannel)
      }
      if (entry.donationCount > 1) {
        messageParts.push(`${entry.donationCount} gifts logged`)
      }

      const timeLabel = formatRelativeTimeLabel(entry.lastContributionAt)

      return {
        id: entry.id,
        who: entry.firstName,
        amount: formatAmount(entry.totalAmount),
        message: messageParts.length > 0 ? messageParts.join(' • ') : undefined,
        time: timeLabel ?? undefined
      }
    })
  }, [publicSupporters])
  const trendInsights = useMemo(() => {
    if (supporterTrend.length === 0) {
      return null
    }

    const total = supporterTrend.reduce((sum, entry) => sum + entry.newSupporters, 0)
    const lastSeven = supporterTrend.slice(-7)
    const lastSevenTotal = lastSeven.reduce((sum, entry) => sum + entry.newSupporters, 0)
    const averagePerDay = lastSeven.length > 0 ? lastSevenTotal / lastSeven.length : 0
    const latestPoint = supporterTrend[supporterTrend.length - 1]
    const bestPoint = supporterTrend.reduce((best, entry) => (entry.newSupporters > best.newSupporters ? entry : best), supporterTrend[0])

    const width = 160
    const height = 72
    const padding = 8
    const usableHeight = height - padding * 2
    const baseline = height - padding
    const maxValue = Math.max(...supporterTrend.map(entry => entry.newSupporters), 1)
    const denominator = Math.max(supporterTrend.length - 1, 1)

    const points = supporterTrend.map((entry, index) => {
      const x = (index / denominator) * width
      const scaledY = entry.newSupporters === 0 ? 0 : (entry.newSupporters / maxValue) * usableHeight
      const y = baseline - scaledY
      return { x, y }
    })

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ')

  const lastPoint = points[points.length - 1]
    const areaPath = [
      `M 0 ${baseline.toFixed(2)}`,
      ...points.map(point => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
      `L ${lastPoint ? lastPoint.x.toFixed(2) : '0'} ${baseline.toFixed(2)}`,
      'Z'
    ].join(' ')

    return {
      total,
      lastSevenTotal,
      averagePerDay,
      latestPoint,
      bestPoint,
      width,
      height,
      baseline,
      linePath,
      areaPath,
      maxValue,
      lastPoint,
      points,
      quietDays: supporterTrend.filter(entry => entry.newSupporters === 0).length,
      startDate: supporterTrend[0].date,
      endDate: supporterTrend[supporterTrend.length - 1].date
    }
  }, [supporterTrend])
  const activeTrendIndex = useMemo(() => {
    if (!trendInsights || supporterTrend.length === 0) {
      return null
    }
    const clamp = (value: number) => Math.min(Math.max(value, 0), supporterTrend.length - 1)
    if (hoveredTrendIndex !== null) {
      return clamp(hoveredTrendIndex)
    }
    if (selectedTrendIndex !== null) {
      return clamp(selectedTrendIndex)
    }
    return supporterTrend.length - 1
  }, [hoveredTrendIndex, selectedTrendIndex, supporterTrend, trendInsights])
  const activeTrendPoint = activeTrendIndex !== null ? supporterTrend[activeTrendIndex] : null
  const trendWindowLabel = trendInsights ? `${formatTrendDate(trendInsights.startDate)} – ${formatTrendDate(trendInsights.endDate)}` : ''
  const weeklyPace = trendInsights ? trendInsights.averagePerDay * 7 : 0
  const trendStats = trendInsights
    ? {
        latestCount: trendInsights.latestPoint.newSupporters,
        latestLabel: formatTrendDate(trendInsights.latestPoint.date),
        bestCount: trendInsights.bestPoint.newSupporters,
        bestLabel: formatTrendDate(trendInsights.bestPoint.date),
        quietDays: trendInsights.quietDays,
        total: trendInsights.total,
        lastSevenTotal: trendInsights.lastSevenTotal
      }
    : null

  const isMpesaChannel = formValues.channel === 'M-Pesa'
  const disableFormInputs = submitting || (isMpesaChannel && mpesaStage === 'pending')
  const submitButtonDisabled = submitting || (isMpesaChannel && (mpesaStage === 'initiating' || mpesaStage === 'pending'))
  const submitButtonLabel = isMpesaChannel
    ? mpesaStage === 'initiating'
      ? 'Contacting M-Pesa…'
      : mpesaStage === 'pending'
        ? 'Awaiting phone approval…'
        : 'Send M-Pesa request'
    : submitting
      ? 'Logging…'
      : 'Log my donation'

  const setTimedAcknowledgement = (message: string, duration = 7000) => {
    setAcknowledgement(message)
    if (ackTimeoutRef.current) {
      clearTimeout(ackTimeoutRef.current)
    }
    ackTimeoutRef.current = setTimeout(() => setAcknowledgement(null), duration)
  }

  const promptLog = (channel: Channel) => {
    resetMpesaState({ preservePhone: channel === 'M-Pesa' })
    setFormValues(prev => ({ ...prev, channel }))
    setFormError(null)
    setTimedAcknowledgement('Let us thank you properly—add your first name and gift below.')
    logSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleVisitorCount = async () => {
    if (hasCountedVisitor) {
      setTimedAcknowledgement('You are already counted among today\'s cheerleaders!')
      return
    }

    setVisitorLoading(true)
    try {
      const response = await fetch('/api/metrics/visitors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`)
      }

      const payload: { count?: number } = await response.json()
      const updated = typeof payload.count === 'number' ? payload.count : null

      if (updated !== null) {
        setVisitorCount(updated)
        setTimedAcknowledgement(`Welcome aboard! You\'re visitor ${numberFormatter.format(updated)} championing emergency care today.`)
      } else {
        setTimedAcknowledgement('Thank you for raising your hand for Mungatsi families!')
      }

      setVisitorError(null)
      setHasCountedVisitor(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(VISITOR_SESSION_KEY, new Date().toISOString())
      }
    } catch (error) {
      console.error('Unable to increment visitor count', error)
      setVisitorError('We could not record that click—please try again in a moment.')
    } finally {
      setVisitorLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    const contributionAmount = Math.round(amountNumber)

    setSubmitting(true)
    setConsentError(null)

    if (formValues.channel === 'M-Pesa') {
      const phone = formValues.phone.trim()
      if (!phone) {
        setFormError('Enter the Safaricom phone number that will approve the donation.')
        setSubmitting(false)
        return
      }

      clearMpesaPolling()
      setMpesaError(null)
      setMpesaReceipt(null)
      setMpesaStage('initiating')
      setPendingShare(null)

      try {
        const response = await fetch('/api/donations/mpesa/initiate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            firstName: trimmedName,
            amount: contributionAmount,
            phone,
            accountReference: trimmedName
          })
        })

        if (!response.ok) {
          const details = await response.json().catch(() => null)
          if (response.status === 400 && details?.error === 'invalid-phone') {
            setFormError(details.message ?? 'Enter a valid Kenyan phone number for M-Pesa.')
          } else if (details?.message) {
            setFormError(details.message)
          } else {
            setFormError('We could not reach M-Pesa right now. Please try again shortly.')
          }
          setMpesaStage('failed')
          setSubmitting(false)
          return
        }

        const payload: { transaction?: { transactionId?: string | null } } = await response.json()
        const transactionId = payload.transaction?.transactionId
        if (!transactionId) {
          setFormError('We could not create the M-Pesa request. Please try again.')
          setMpesaStage('failed')
          setSubmitting(false)
          return
        }

        setMpesaTransactionId(transactionId)
        mpesaStartRef.current = Date.now()
        setMpesaStage('pending')
        setTimedAcknowledgement(
          `Approve the prompt on ${maskPhoneNumber(phone)} to complete your donation.`
        )
        setFormError(null)
      } catch (error) {
        console.error('Unable to initiate MPesa donation', error)
        setFormError('We could not reach M-Pesa right now. Please try again shortly.')
        setMpesaStage('failed')
      } finally {
        setSubmitting(false)
      }

      return
    }

    resetMpesaState({ preservePhone: false })

    try {
      const response = await fetch('/api/donations/supporters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: trimmedName,
          amount: contributionAmount,
          channel: formValues.channel,
          shareConsent: 'pending'
        })
      })

      if (!response.ok) {
        const details = await response.json().catch(() => null)
        if (response.status === 400 && details?.error === 'invalid-name') {
          setFormError('Please use letters only for your first name so we can celebrate you properly.')
          return
        }
        throw new Error(`Unexpected status ${response.status}`)
      }

      const payload: { supporter: SupporterSnapshot; totals: SupporterTotals; recentNewSupporters: SupporterTrendPoint[] } =
        await response.json()

      triggerDonationCelebration()
      setPendingShare({
        supporterId: payload.supporter.id,
        firstName: payload.supporter.firstName,
        amount: contributionAmount
      })
      setTimedAcknowledgement(
        `Thank you, ${payload.supporter.firstName}! Your ${formValues.channel} gift is already powering emergency care.`
      )
      setFormValues(prev => ({ ...prev, firstName: '', amount: '' }))
      setFormError(null)
      setSupporterTotals(payload.totals)
  setSupporterTrend(payload.recentNewSupporters)
      await loadSupporters(undefined, true)
    } catch (error) {
      console.error('Unable to log contribution', error)
      setFormError('We could not log your gift right now. Please try again or WhatsApp the clinic.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConsent = async (response: Exclude<ConsentState, 'pending'>) => {
    if (!pendingShare) return

    setConsentError(null)
    setConsentSubmitting(true)

    try {
      const apiResponse = await fetch('/api/donations/supporters', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          supporterId: pendingShare.supporterId,
          shareConsent: response
        })
      })

      if (!apiResponse.ok) {
        const details = await apiResponse.json().catch(() => null)
        if (apiResponse.status === 404 || details?.error === 'not-found') {
          setConsentError('We could not locate your supporter record. Please log your gift again.')
          setConsentSubmitting(false)
          return
        }
        throw new Error(`Unexpected status ${apiResponse.status}`)
      }

      const payload: { supporter: SupporterSnapshot; totals: SupporterTotals; recentNewSupporters: SupporterTrendPoint[] } =
        await apiResponse.json()
      setSupporterTotals(payload.totals)
      setSupporterTrend(payload.recentNewSupporters)
      await loadSupporters(undefined, true)

      const name = pendingShare.firstName
      if (response === 'granted') {
        setTimedAcknowledgement(`We'll celebrate you on our gratitude wall, ${name}!`)
      } else {
        setTimedAcknowledgement(`We'll keep your gift private, ${name}. Thank you for the trust.`)
      }

      setPendingShare(null)
    } catch (error) {
      console.error('Unable to update supporter acknowledgement', error)
      setConsentError('We could not save that preference. Please try again in a moment.')
    } finally {
      setConsentSubmitting(false)
    }
  }

  useEffect(() => {
    if (mpesaStage !== 'pending' || !mpesaTransactionId) {
      return
    }

    let cancelled = false

    const poll = async () => {
      if (cancelled) {
        return
      }

      const startedAt = mpesaStartRef.current
      if (startedAt && Date.now() - startedAt > 180000) {
        clearMpesaPolling()
        setMpesaStage('failed')
        setMpesaError('We did not receive confirmation in time. Please try again to resend the M-Pesa prompt.')
        setMpesaTransactionId(null)
        mpesaStartRef.current = null
        return
      }

      try {
        const response = await fetch(`/api/donations/mpesa/status/${mpesaTransactionId}`, {
          headers: { 'cache-control': 'no-store' }
        })

        if (!response.ok) {
          if (response.status === 404) {
            clearMpesaPolling()
            setMpesaStage('failed')
            setMpesaError('We could not locate that donation attempt. Please try again.')
            setMpesaTransactionId(null)
            mpesaStartRef.current = null
          }
          return
        }

        const payload: {
          transaction: {
            status: MpesaTransactionStatus
            failureReason?: string | null
            supporterId?: string | null
            mpesaReceiptNumber?: string | null
            totals?: SupporterTotals
            recentNewSupporters?: SupporterTrendPoint[]
            firstName: string
            amount: number
          }
        } = await response.json()

        const transaction = payload.transaction

        if (transaction.status === 'SUCCESS') {
          clearMpesaPolling()
          setMpesaError(null)
          setMpesaReceipt(transaction.mpesaReceiptNumber ?? null)
          setTimedAcknowledgement(`Thank you, ${transaction.firstName}! Your M-Pesa gift is already powering emergency care.`)
          triggerDonationCelebration()
          if (transaction.supporterId) {
            setPendingShare({
              supporterId: transaction.supporterId,
              firstName: transaction.firstName,
              amount: transaction.amount
            })
          }
          if (transaction.totals) {
            setSupporterTotals(transaction.totals)
          }
          if (transaction.recentNewSupporters) {
            setSupporterTrend(transaction.recentNewSupporters)
          }
          await loadSupporters(undefined, true)
          setFormValues(prev => ({ ...prev, firstName: '', amount: '', channel: 'M-Pesa' }))
          setMpesaTransactionId(null)
          setMpesaStage('idle')
          mpesaStartRef.current = null
          return
        }

        if (transaction.status === 'FAILED') {
          clearMpesaPolling()
          setMpesaStage('failed')
          setMpesaReceipt(null)
          setMpesaError(transaction.failureReason ?? 'The M-Pesa request was cancelled or timed out. Please try again.')
          setMpesaTransactionId(null)
          mpesaStartRef.current = null
          return
        }
      } catch (error) {
        console.error('Unable to poll MPesa transaction status', error)
      }
    }

    poll()
    const interval = setInterval(poll, 4000)
    mpesaPollRef.current = interval

    return () => {
      cancelled = true
      clearInterval(interval)
      if (mpesaPollRef.current === interval) {
        mpesaPollRef.current = null
      }
    }
  }, [mpesaStage, mpesaTransactionId, clearMpesaPolling, loadSupporters])

  const copyTillNumber = async () => {
    try {
      await navigator.clipboard.writeText(MPESA_TILL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Unable to copy till number', error)
    }
  }

  const handleTrendKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!trendInsights || supporterTrend.length === 0) {
        return
      }

      const clamp = (value: number) => Math.min(Math.max(value, 0), supporterTrend.length - 1)
      const { key } = event
      const supportedKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'] as const

      if (!supportedKeys.includes(key as (typeof supportedKeys)[number])) {
        return
      }

      event.preventDefault()

      const baseIndex = (() => {
        if (hoveredTrendIndex !== null) {
          return hoveredTrendIndex
        }
        if (selectedTrendIndex !== null) {
          return selectedTrendIndex
        }
        return supporterTrend.length - 1
      })()

      let nextIndex = baseIndex

      if (key === 'ArrowLeft') {
        nextIndex = clamp(baseIndex - 1)
      } else if (key === 'ArrowRight') {
        nextIndex = clamp(baseIndex + 1)
      } else if (key === 'Home') {
        nextIndex = 0
      } else if (key === 'End') {
        nextIndex = supporterTrend.length - 1
      }

      setSelectedTrendIndex(nextIndex)
      setHoveredTrendIndex(null)
    },
    [hoveredTrendIndex, selectedTrendIndex, supporterTrend, trendInsights]
  )

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

      <div className="card border-primary/30 bg-white/70 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">
              {visitorCount === null ? 'Counting neighbours cheering this work…' : `${numberFormatter.format(visitorCount)} neighbours have checked in today.`}
            </p>
            <p className="text-xs text-slate-500">
              Tap the button once to add yourself—no sign-up required, just solidarity.
            </p>
          </div>
          <button
            type="button"
            onClick={handleVisitorCount}
            className="btn-primary"
            disabled={visitorLoading || hasCountedVisitor}
          >
            {visitorLoading ? 'Counting…' : hasCountedVisitor ? 'You are counted ❤' : 'Count me in'}
          </button>
        </div>
        {visitorError && <p className="text-xs font-medium text-rose-600">{visitorError}</p>}
      </div>

      <div className="card border-primary/30 bg-white/80 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">
              {numberFormatter.format(supporterTotals.activeSupporters)} supporter{supporterTotals.activeSupporters === 1 ? '' : 's'} fuelled care in the last 30 days.
            </p>
            <p className="text-xs text-slate-500">
              {supporterTotals.newSupporters > 0
                ? `${numberFormatter.format(supporterTotals.newSupporters)} first-time champion${supporterTotals.newSupporters === 1 ? ' has' : 's have'} joined this month.`
                : 'Be the first new supporter this month—your gift keeps the ward lights on.'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {supporterTotals.publicSupporters > 0
              ? `${numberFormatter.format(supporterTotals.publicSupporters)} name${supporterTotals.publicSupporters === 1 ? '' : 's'} celebrated on our wall`
              : 'Add your name to our gratitude wall'}
          </div>
        </div>
      </div>

      <DonationRail
        items={donationRailItems}
        durationSec={48}
        heightPx={78}
        className="rounded-3xl border border-primary/20 shadow-lg"
      />

      <div className="card border-primary/40 bg-white/80 shadow-lg">
        {trendInsights && trendStats ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">Supporter momentum (30 days)</p>
                <p className="text-xs text-slate-500">{trendWindowLabel}</p>
                <p className="text-xs text-slate-500">
                  {trendStats.total > 0
                    ? `${numberFormatter.format(trendStats.total)} neighbours have stepped up this month. On ${trendStats.latestLabel} we recorded ${numberFormatter.format(trendStats.latestCount)} new supporter${trendStats.latestCount === 1 ? '' : 's'}.`
                    : 'We have not logged a new supporter in the last few days—your donation could start the trend.'}
                </p>
              </div>
              <div
                className="flex flex-col items-end gap-2"
                role="group"
                aria-label="Daily new supporters over the last 30 days"
                aria-describedby="supporter-trend-instructions"
                tabIndex={0}
                onKeyDown={handleTrendKeyDown}
                onFocus={event => {
                  if (event.currentTarget === event.target && selectedTrendIndex === null && supporterTrend.length > 0) {
                    setSelectedTrendIndex(supporterTrend.length - 1)
                  }
                }}
              >
                <p id="supporter-trend-instructions" className="sr-only">
                  Use left and right arrow keys to move between each day. Press Home to jump to the first day or End for the most recent day.
                </p>
                <svg
                  viewBox={`0 0 ${trendInsights.width} ${trendInsights.height}`}
                  role="img"
                  aria-label="Daily new supporters over the last 30 days"
                  className="h-28 w-full max-w-[220px] text-primary"
                  preserveAspectRatio="none"
                  onPointerLeave={() => setHoveredTrendIndex(null)}
                >
                  <defs>
                    <linearGradient id="supporter-trend-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(14,165,233,0.35)" />
                      <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                    </linearGradient>
                  </defs>
                  <path d={`M 0 ${trendInsights.baseline.toFixed(2)} L ${trendInsights.width} ${trendInsights.baseline.toFixed(2)}`} stroke="rgba(148,163,184,0.35)" strokeDasharray="4 4" fill="none" />
                  <path d={trendInsights.areaPath} fill="url(#supporter-trend-fill)" />
                  <path d={trendInsights.linePath} fill="none" stroke="rgba(14,165,233,1)" strokeWidth={2} strokeLinecap="round" />
                  {trendInsights.points.map((point, index) => {
                    const isActive = activeTrendIndex === index
                    const supporterPoint = supporterTrend[index]
                    const ariaLabel = `On ${formatTrendDate(supporterPoint.date)}, ${supporterPoint.newSupporters} supporter${supporterPoint.newSupporters === 1 ? '' : 's'}`
                    return (
                      <g key={supporterPoint.date}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isActive ? 3.5 : 2.5}
                          fill={isActive ? 'rgba(14,165,233,1)' : 'rgba(14,165,233,0.6)'}
                          stroke={isActive ? 'white' : 'transparent'}
                          strokeWidth={isActive ? 1.6 : 0}
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={6}
                          fill="transparent"
                          stroke="transparent"
                          tabIndex={0}
                          focusable="true"
                          role="button"
                          aria-label={ariaLabel}
                          onPointerEnter={() => setHoveredTrendIndex(index)}
                          onFocus={() => {
                            setSelectedTrendIndex(index)
                            setHoveredTrendIndex(null)
                          }}
                          onBlur={() => setHoveredTrendIndex(null)}
                        />
                      </g>
                    )
                  })}
                </svg>
                {activeTrendPoint && (
                  <div className="w-full rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600" aria-live="polite" role="status">
                    <span className="font-semibold text-slate-700">{formatTrendDate(activeTrendPoint.date)}</span>
                    <span className="ml-2">
                      {numberFormatter.format(activeTrendPoint.newSupporters)} new supporter
                      {activeTrendPoint.newSupporters === 1 ? '' : 's'} recorded
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                  Daily new supporters
                </div>
              </div>
            </div>
            <dl className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
              <div className="rounded-lg bg-primary/5 px-3 py-2">
                <dt className="font-semibold text-primary">7-day pace</dt>
                <dd className="text-slate-700">
                  {paceFormatter.format(weeklyPace)} supporters / week
                  <span className="block text-[11px] text-slate-500">{numberFormatter.format(trendStats.lastSevenTotal)} logged in the last 7 days</span>
                </dd>
              </div>
              <div className="rounded-lg bg-primary/5 px-3 py-2">
                <dt className="font-semibold text-primary">Busiest day</dt>
                <dd className="text-slate-700">{trendStats.bestLabel}: {numberFormatter.format(trendStats.bestCount)}</dd>
              </div>
              <div className="rounded-lg bg-primary/5 px-3 py-2">
                <dt className="font-semibold text-primary">Quiet days</dt>
                <dd className="text-slate-700">{numberFormatter.format(trendStats.quietDays)} of 30</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Supporter momentum (30 days)</p>
              <p className="text-xs text-slate-500">We are collecting new supporter stories—check back shortly for this chart.</p>
            </div>
            <p className="text-xs text-slate-500">Log a donation to light up this graph.</p>
          </div>
        )}
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
                <p className="text-2xl font-semibold text-primary">{formatAmount(supporterTotals.totalAmount)}</p>
                <p className="text-xs text-slate-500">
                  {numberFormatter.format(supporterTotals.totalSupporters)} supporter{supporterTotals.totalSupporters === 1 ? '' : 's'} ·{' '}
                  {numberFormatter.format(supporterTotals.totalGifts)} gift{supporterTotals.totalGifts === 1 ? '' : 's'} logged
                </p>
                <p className="text-xs text-slate-400">{numberFormatter.format(supporterTotals.activeSupporters)} active in the last 30 days</p>
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
                  disabled={disableFormInputs}
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
                  disabled={disableFormInputs}
                  required
                />
              </label>
              {isMpesaChannel && (
                <label className="sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Safaricom phone</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formValues.phone}
                    onChange={event => setFormValues(prev => ({ ...prev, phone: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="07xx xxx xxx"
                    disabled={mpesaStage === 'pending'}
                    required
                  />
                  <span className="mt-1 block text-xs text-slate-500">We&rsquo;ll send an STK push to this Safaricom number. Use the line that will authorise the donation.</span>
                </label>
              )}
              <label className="sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</span>
                <select
                  value={formValues.channel}
                  onChange={event => {
                    const nextChannel = event.target.value as Channel
                    resetMpesaState({ preservePhone: nextChannel === 'M-Pesa' })
                    setFormValues(prev => ({ ...prev, channel: nextChannel }))
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={mpesaStage === 'pending'}
                >
                  <option value="M-Pesa">M-Pesa Till {MPESA_TILL}</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash/Other">Cash / Other</option>
                </select>
              </label>
              {formError && (
                <p className="sm:col-span-2 text-sm font-medium text-rose-500">{formError}</p>
              )}
              {isMpesaChannel && mpesaStage === 'pending' && formValues.phone && (
                <p className="sm:col-span-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
                  We sent an STK push to {maskPhoneNumber(formValues.phone)}. Approve it on your phone to finish.
                </p>
              )}
              {isMpesaChannel && mpesaError && (
                <p className="sm:col-span-2 text-sm font-medium text-rose-500">{mpesaError}</p>
              )}
              {isMpesaChannel && mpesaReceipt && (
                <p className="sm:col-span-2 text-sm text-emerald-600">Receipt {mpesaReceipt} recorded. Thank you for fuelling emergency care!</p>
              )}
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <button type="submit" className="btn-primary" disabled={submitButtonDisabled}>
                  <PartyPopper className="h-4 w-4" />
                  {submitButtonLabel}
                </button>
                <button type="button" onClick={resetDonationForm} className="btn-outline" disabled={mpesaStage === 'pending'}>
                  Clear form
                </button>
              </div>
            </form>

            {(latestPublic.length > 0 || supporterLoading || supporterError) && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700">Gratitude wall</h4>
                {supporterError && <p className="mt-1 text-xs font-medium text-rose-500">{supporterError}</p>}
                {supporterLoading && !supporterError && (
                  <p className="mt-1 text-xs text-slate-500">Updating today&apos;s gratitude roll…</p>
                )}
                {latestPublic.length > 0 && (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {latestPublic.map(entry => (
                      <li key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-medium text-slate-800">{entry.firstName}</span>
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          {entry.donationCount === 1
                            ? '1 gift'
                            : `${entry.donationCount} gifts`}
                          {entry.lastChannel ? ` · ${entry.lastChannel}` : ''}
                        </span>
                        <span className="font-semibold text-primary">{formatAmount(entry.totalAmount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {latestPublic.length === 0 && !supporterLoading && !supporterError && (
                  <p className="mt-2 text-xs text-slate-500">Be the first to let us celebrate your gift today.</p>
                )}
                {publicSupporters.length > latestPublic.length && latestPublic.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {publicSupporters.length - latestPublic.length} more supporter{publicSupporters.length - latestPublic.length === 1 ? '' : 's'} honoured privately.
                  </p>
                )}
              </div>
            )}
          </div>

          {pendingShare && (
            <div className="card border-dashed border-primary/40 bg-primary/5 text-primary">
              <p className="text-sm font-semibold">Thank you, {pendingShare.firstName}! May we list your gift of {formatAmount(pendingShare.amount)}?</p>
              <p className="text-xs text-primary/80">We only display first names, total gifts, and channels on the gratitude wall.</p>
              {consentError && <p className="text-xs font-medium text-rose-600">{consentError}</p>}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleConsent('granted')}
                  className="btn-primary"
                  disabled={consentSubmitting}
                >
                  Yes, celebrate it
                </button>
                <button
                  type="button"
                  onClick={() => handleConsent('declined')}
                  className="btn-outline"
                  disabled={consentSubmitting}
                >
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

          <div className="card space-y-3 border-primary/20 bg-primary/5">
            <h3 className="text-lg font-semibold text-primary">Accountability & reporting</h3>
            <p className="text-sm text-primary/80">
              We log donations securely and issue statements on request. Financial summaries are shared with community partners every quarter,
              and sensitive details follow our <a href="/privacy" className="underline">privacy policy</a> and Kenya Data Protection Act guidelines.
            </p>
            <p className="text-xs text-primary/70">Need a receipt or impact report? Email <a href="mailto:mweinmedical@gmail.com" className="underline">mweinmedical@gmail.com</a> or WhatsApp{' '}
              <a href="https://wa.me/254707711888" className="underline">+254 707 711 888</a>.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
