import nodemailer from 'nodemailer'

export type EmailSendResult =
  | { status: 'sent'; messageId: string | null; recipient: string }
  | { status: 'skipped'; reason: 'missing-config' | 'missing-recipient' }

export type EmailPayload = {
  subject: string
  html: string
  text?: string
  to?: string
  replyTo?: string
}

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  defaultRecipient: string | null
}

let cachedConfig: SmtpConfig | null = null
let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null

function resolveSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()

  if (!host || !user || !pass) {
    return null
  }

  const port = Number(process.env.SMTP_PORT || 587)
  const secure = process.env.SMTP_SECURE === 'true'
  const from = (process.env.SMTP_FROM?.trim() || user)
  const defaultRecipient = process.env.CONTACT_EMAIL?.trim() || user

  return { host, port, secure, user, pass, from, defaultRecipient }
}

function getTransporter(config: SmtpConfig) {
  if (cachedTransporter && cachedConfig) {
    const sameConfig =
      cachedConfig.host === config.host &&
      cachedConfig.port === config.port &&
      cachedConfig.secure === config.secure &&
      cachedConfig.user === config.user

    if (sameConfig) {
      return cachedTransporter
    }
  }

  cachedConfig = config
  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })

  return cachedTransporter
}

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const config = resolveSmtpConfig()
  if (!config) {
    console.warn('Email skipped: SMTP configuration is incomplete', { subject: payload.subject })
    return { status: 'skipped', reason: 'missing-config' }
  }

  const to = payload.to?.trim() || config.defaultRecipient
  if (!to) {
    console.warn('Email skipped: No recipient specified', { subject: payload.subject })
    return { status: 'skipped', reason: 'missing-recipient' }
  }

  const transporter = getTransporter(config)
  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo
  })

  const messageId = typeof info?.messageId === 'string' ? info.messageId : null
  return { status: 'sent', messageId, recipient: to }
}
