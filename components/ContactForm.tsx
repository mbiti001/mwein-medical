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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="hidden" aria-hidden>
        <label>Leave this field empty</label>
        <input type="text" tabIndex={-1} autoComplete="off" {...register('botField')} />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Name</label>
        <input className="mt-1 block w-full border rounded px-3 py-2" {...register('name')} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Phone</label>
        <input className="mt-1 block w-full border rounded px-3 py-2" {...register('phone')} />
        {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Email (optional)</label>
        <input className="mt-1 block w-full border rounded px-3 py-2" {...register('email')} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">Age</label>
          <input type="number" min="0" max="120" className="mt-1 block w-full border rounded px-3 py-2" {...register('age')} />
          {errors.age && <p className="text-sm text-red-600">{errors.age.message}</p>}
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Gender</label>
          <select className="mt-1 block w-full border rounded px-3 py-2" {...register('gender')}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non_binary">Non-binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Consultation type</label>
          <select className="mt-1 block w-full border rounded px-3 py-2" {...register('visitType')}>
            <option value="in_person">In-person at the clinic</option>
            <option value="telehealth">Telehealth (video/phone)</option>
          </select>
          {errors.visitType && <p className="text-sm text-red-600">{errors.visitType.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">Preferred date</label>
          <input type="date" className="mt-1 block w-full border rounded px-3 py-2" {...register('preferredDate')} />
          {errors.preferredDate && <p className="text-sm text-red-600">{errors.preferredDate.message}</p>}
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Preferred time</label>
          <input type="time" className="mt-1 block w-full border rounded px-3 py-2" {...register('preferredTime')} />
          {errors.preferredTime && <p className="text-sm text-red-600">{errors.preferredTime.message}</p>}
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Reason for visit</label>
        <textarea rows={4} className="mt-1 block w-full border rounded px-3 py-2" {...register('reason')} />
        {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
      </div>

      <button type="submit" className="btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Submit request'}
      </button>

  {status === 'success' && <p className="text-sm text-green-600">Thanks! We’ll reach out shortly.</p>}
      {status === 'error' && <p className="text-sm text-red-600">Something went wrong. Please try again or call us directly.</p>}

      {visitType === 'telehealth' && (
        <p className="text-xs text-slate-500">
          Telehealth slots require payment confirmation and the clinical details listed above. Include your preferred video platform in the notes if applicable.
        </p>
      )}
    </form>
  )
}
