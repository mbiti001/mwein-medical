import crypto from 'crypto'
import bcrypt from 'bcryptjs'

import { prisma } from './prisma'
import { env } from './env'
import { sendEmail } from './email'

const RESET_TOKEN_BYTES = 32
const RESET_TOKEN_TTL_MINUTES = 30

function createToken() {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex')
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function issueAdminPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    return { status: 'not-found' as const }
  }

  const rawToken = createToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

  await prisma.adminPasswordReset.deleteMany({ where: { adminUserId: user.id } })

  await prisma.adminPasswordReset.create({
    data: {
      tokenHash,
      email: normalizedEmail,
      adminUserId: user.id,
      expiresAt
    }
  })

  const resetUrl = new URL('/reset-password', env.SITE_URL)
  resetUrl.searchParams.set('token', rawToken)
  resetUrl.searchParams.set('email', normalizedEmail)

  const emailBody = `Hi ${user.email},\n\nWe received a request to reset your Mwein admin password.\n\nReset link: ${resetUrl.toString()}\nThis link expires in ${RESET_TOKEN_TTL_MINUTES} minutes.\n\nIf you didn't request this, you can ignore this email.`

  const emailResult = await sendEmail({
    subject: 'Reset your Mwein admin password',
    text: emailBody,
    html: `<p>We received a request to reset the Mwein Medical admin password.</p><p><a href="${resetUrl.toString()}">Reset password</a> (expires in ${RESET_TOKEN_TTL_MINUTES} minutes)</p><p>If you didn't request this, ignore this email.</p>`,
    to: 'mweinmedical@gmail.com'
  })

  if (emailResult.status !== 'sent') {
    console.warn('Admin reset email not sent', emailResult)
  }

  return { status: 'issued' as const }
}

export async function consumeAdminPasswordReset({ token, email, newPassword }: { token: string; email: string; newPassword: string }) {
  const normalizedEmail = email.trim().toLowerCase()
  const tokenHash = hashToken(token)

  const record = await prisma.adminPasswordReset.findUnique({ where: { tokenHash } })
  if (!record || record.usedAt || record.email !== normalizedEmail || record.expiresAt < new Date()) {
    return { status: 'invalid' as const }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  const result = await prisma.$transaction(async transaction => {
    const user = await transaction.adminUser.update({
      where: { id: record.adminUserId },
      data: { passwordHash }
    })

    await transaction.adminPasswordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    })

    return user
  })

  return { status: 'updated' as const, user: result }
}
