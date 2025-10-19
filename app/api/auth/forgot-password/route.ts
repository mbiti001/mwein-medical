import { NextResponse } from 'next/server'
import { z } from 'zod'

import { issueAdminPasswordReset } from '../../../../lib/adminPasswordReset'

const schema = z.object({
  email: z.string().email().max(254)
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json())
    await issueAdminPasswordReset(payload.email)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
    }

    console.error('Forgot password request failed', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
