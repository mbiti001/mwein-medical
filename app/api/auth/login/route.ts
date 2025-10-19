import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPassword, createSession, normaliseAdminRole } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { email, password } = schema.parse(payload)

    const user = await prisma.adminUser.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const role = normaliseAdminRole(user.role)
    createSession(user.id, role, user.email)
    return NextResponse.json({ success: true, role })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues?.[0]?.message || 'Invalid payload' }, { status: 400 })
    }
    console.error('Login error', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
