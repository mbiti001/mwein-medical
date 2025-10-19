import { NextResponse } from 'next/server'
import { z } from 'zod'

import { consumeAdminPasswordReset } from '../../../../lib/adminPasswordReset'

const schema = z.object({
  email: z.string().email().max(254),
  token: z.string().min(10),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json())
    const result = await consumeAdminPasswordReset({
      email: payload.email,
      token: payload.token,
      newPassword: payload.password
    })

    if (result.status !== 'updated') {
      return NextResponse.json({ error: 'invalid-token' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
    }

    console.error('Reset password request failed', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
