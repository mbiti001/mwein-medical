import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const createMock = vi.fn()
const updateMock = vi.fn()
const sendMailMock = vi.fn()
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }))

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    appointmentRequest: {
      create: createMock,
      update: updateMock
    }
  }
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: createTransportMock
  }
}))

describe('POST /api/contact', () => {
  beforeEach(() => {
    createMock.mockReset()
    updateMock.mockReset()
    sendMailMock.mockReset()
    createTransportMock.mockClear()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('persists appointment requests even when SMTP is disabled', async () => {
    createMock.mockResolvedValue({
      id: 'appt_123',
      name: 'Jane',
      phone: '+254700000000',
      email: 'test@example.com',
      preferredDate: '2025-10-18',
      preferredTime: '10:30',
      reason: 'Follow-up visit',
      consultationType: 'TELEHEALTH'
    })

    const payload = {
      name: 'Jane',
      phone: '+254700000000',
      email: 'test@example.com',
      preferredDate: '2025-10-18',
      preferredTime: '10:30',
  reason: 'Follow-up visit',
  age: 32,
  gender: 'female',
  visitType: 'telehealth',
  botField: ''
    }

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.5'
      },
      body: JSON.stringify(payload)
    })

    const { POST } = await import('./route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        preferredDate: payload.preferredDate,
        preferredTime: payload.preferredTime,
        reason: payload.reason,
        patientAge: payload.age,
        patientGender: payload.gender,
        consultationType: 'TELEHEALTH',
        consultationDate: expect.any(Date),
        identifier: '203.0.113.5'
      })
    })
    expect(updateMock).not.toHaveBeenCalled()
    expect(createTransportMock).not.toHaveBeenCalled()
    expect(data).toMatchObject({ ok: true, notice: 'no-smtp', id: 'appt_123' })
  })

  it('sends email when SMTP is configured and returns record id', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('SMTP_USER', 'user@example.com')
    vi.stubEnv('SMTP_PASS', 'secret')

    createMock.mockResolvedValue({
      id: 'appt_456'
    })
    sendMailMock.mockResolvedValue(undefined)

    const payload = {
      name: 'John',
      phone: '+254711111111',
      email: '',
      preferredDate: '2025-10-19',
      preferredTime: '08:00',
      reason: 'Routine check',
      age: 41,
      gender: 'male',
      visitType: 'in_person',
      botField: ''
    }

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '198.51.100.10'
      },
      body: JSON.stringify(payload)
    })

    const { POST } = await import('./route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        patientAge: payload.age,
        patientGender: payload.gender,
        consultationType: 'IN_PERSON',
        consultationDate: expect.any(Date)
      })
    })
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'secret'
      }
    })
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: expect.stringContaining('Appointment request')
    }))
    expect(data).toMatchObject({ ok: true, id: 'appt_456' })
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('annotates the record when email delivery fails', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('SMTP_USER', 'user@example.com')
    vi.stubEnv('SMTP_PASS', 'secret')

    createMock.mockResolvedValue({ id: 'appt_789' })
    sendMailMock.mockRejectedValue(new Error('SMTP failure'))
    updateMock.mockResolvedValue({})

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Mary',
        phone: '+254722222222',
        email: '',
        preferredDate: '2025-10-20',
        preferredTime: '14:00',
        reason: 'Emergency follow-up',
        age: 28,
        gender: 'prefer_not_to_say',
        visitType: 'telehealth',
        botField: ''
      })
    })

    const { POST } = await import('./route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'server' })
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'appt_789' },
      data: expect.objectContaining({
        notes: expect.stringContaining('SMTP failure')
      })
    })
  })
})
