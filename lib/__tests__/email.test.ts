import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendEmail } from '../email'

const sendMailMock = vi.fn(async () => ({ messageId: 'abc123' }))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock }))
  }
}))

describe('sendEmail', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.CONTACT_EMAIL
    delete process.env.SMTP_FROM
    delete process.env.SMTP_PORT
    delete process.env.SMTP_SECURE
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('skips sending when SMTP configuration is incomplete', async () => {
    const result = await sendEmail({ subject: 'Test', html: '<p>Test</p>' })

    expect(result).toEqual({ status: 'skipped', reason: 'missing-config' })
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('sends email with resolved defaults when configuration is available', async () => {
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'mailer@example.com'
    process.env.SMTP_PASS = 'secret'
    process.env.CONTACT_EMAIL = 'alerts@example.com'
    process.env.SMTP_FROM = 'Clinic <mailer@example.com>'
    process.env.SMTP_PORT = '2525'
    process.env.SMTP_SECURE = 'false'

    const result = await sendEmail({ subject: 'Test', html: '<p>Test</p>', text: 'Test text' })

    expect(result).toEqual({ status: 'sent', messageId: 'abc123', recipient: 'alerts@example.com' })
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'Clinic <mailer@example.com>',
      to: 'alerts@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test text',
      replyTo: undefined
    })
  })
})
