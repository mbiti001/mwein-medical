'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const genderOptions = ['female', 'male', 'non_binary', 'prefer_not_to_say'] as const
const visitTypeOptions = ['in_person', 'telehealth'] as const

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  preferredDate: z.string().min(1, 'Please choose a preferred date'),
  preferredTime: z.string().min(1, 'Please choose a preferred time'),
  reason: z.string().min(3, 'Reason is required'),
  age: z
    .string()
    .min(1, 'Age is required')
    .refine(value => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Enter a valid age')
    .refine(value => Number(value) <= 120, 'Enter an age under 120'),
  gender: z.enum(genderOptions),
  visitType: z.enum(visitTypeOptions),
  botField: z.string().max(0).optional()
})

type FormData = z.infer<typeof schema>

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const defaultValues = {
    age: '',
    email: '',
    botField: '',
    visitType: 'in_person',
    gender: 'female'
  } satisfies Partial<FormData>
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues
  })

  const visitType = watch('visitType')

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      age: Number(data.age)
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setStatus('success')
        reset()
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Failed to submit contact request', error)
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="hidden" aria-hidden>
        <label className="form-label">Leave this field empty</label>
        <input type="text" tabIndex={-1} autoComplete="off" {...register('botField')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="form-field">
          <label className="form-label" htmlFor="contact-name">Name</label>
          <input id="contact-name" className="form-input" aria-invalid={Boolean(errors.name)} {...register('name')} />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="contact-phone">Phone</label>
          <input id="contact-phone" className="form-input" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
          {errors.phone && <p className="form-error">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="contact-email">Email (optional)</label>
        <input id="contact-email" className="form-input" aria-invalid={Boolean(errors.email)} {...register('email')} />
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="form-field">
          <label className="form-label" htmlFor="contact-age">Age</label>
          <input
            id="contact-age"
            type="number"
            min="0"
            max="120"
            inputMode="numeric"
            className="form-input"
            aria-invalid={Boolean(errors.age)}
            {...register('age')}
          />
          {errors.age && <p className="form-error">{errors.age.message}</p>}
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="contact-gender">Gender</label>
          <select id="contact-gender" className="form-select" aria-invalid={Boolean(errors.gender)} {...register('gender')}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          {errors.gender && <p className="form-error">{errors.gender.message}</p>}
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="contact-visitType">Consultation type</label>
          <select id="contact-visitType" className="form-select" aria-invalid={Boolean(errors.visitType)} {...register('visitType')}>
            <option value="in_person">In-person at the clinic</option>
            <option value="telehealth">Telehealth (video/phone)</option>
          </select>
          {errors.visitType && <p className="form-error">{errors.visitType.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="form-field">
          <label className="form-label" htmlFor="contact-preferredDate">Preferred date</label>
          <input id="contact-preferredDate" type="date" className="form-input" aria-invalid={Boolean(errors.preferredDate)} {...register('preferredDate')} />
          {errors.preferredDate && <p className="form-error">{errors.preferredDate.message}</p>}
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="contact-preferredTime">Preferred time</label>
          <input id="contact-preferredTime" type="time" className="form-input" aria-invalid={Boolean(errors.preferredTime)} {...register('preferredTime')} />
          {errors.preferredTime && <p className="form-error">{errors.preferredTime.message}</p>}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="contact-reason">Reason for visit</label>
        <textarea id="contact-reason" className="form-textarea" aria-invalid={Boolean(errors.reason)} {...register('reason')} />
        {errors.reason && <p className="form-error">{errors.reason.message}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Submit request'}
        </button>
        <span
          role="status"
          aria-live="polite"
          className={`text-sm ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-slate-500'}`}
        >
          {status === 'success' && 'Thanks! We’ll reach out shortly.'}
          {status === 'error' && 'Something went wrong. Please try again or call us directly.'}
          {status === 'sending' && 'Sending your request…'}
        </span>
      </div>

      {visitType === 'telehealth' && (
        <p className="form-hint">
          Telehealth slots require payment confirmation and the clinical details listed above. Include your preferred video platform in the notes if applicable.
        </p>
      )}
    </form>
  )
}
