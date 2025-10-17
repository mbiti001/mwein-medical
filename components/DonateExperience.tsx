"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Gift, HeartHandshake, PartyPopper } from 'lucide-react'
import { triggerDonationCelebration } from './DonationCelebration'

const MPESA_TILL = '8121096'

export default function DonateExperience() {
  const [copied, setCopied] = useState(false)
  const [acknowledgement, setAcknowledgement] = useState<string | null>(null)

  const handleCelebrate = (channel: string) => {
    triggerDonationCelebration()
    setAcknowledgement(`Thank you for supporting care via ${channel}!`)
    window.setTimeout(() => setAcknowledgement(null), 6000)
  }

  const copyTillNumber = async () => {
    try {
      await navigator.clipboard.writeText(MPESA_TILL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Unable to copy till number', error)
    }
  }

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
            <button onClick={() => handleCelebrate('a direct gift')} className="btn-primary bg-white text-primary shadow-xl hover:bg-white/80">
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

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
              <button onClick={() => handleCelebrate('M-Pesa')} className="btn-primary">
                <PartyPopper className="h-4 w-4" />
                I sent via M-Pesa
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
                onClick={() => handleCelebrate('PayPal')}
                className="btn-primary"
              >
                Donate with PayPal
              </a>
              <button onClick={() => handleCelebrate('PayPal follow-up')} className="btn-outline">
                <PartyPopper className="h-4 w-4" />
                I just gave via PayPal
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
