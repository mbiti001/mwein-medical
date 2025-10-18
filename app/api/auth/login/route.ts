import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { ADMIN_SESSION_COOKIE, DEFAULT_SESSION_TTL, createAdminSessionToken, normaliseAdminRole } from '../../../../lib/auth'
import { env } from '../../../../lib/env'
import { prisma } from '../../../../lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

export async function POST(request: Request) {
  try {
    if (isBuildPhase) {
      return NextResponse.json({ ok: true, skipped: 'build-phase' })
    }

    if (!env.adminSessionSecret) {
      console.error('Admin login blocked: ADMIN_SESSION_SECRET is missing')
      return NextResponse.json({ error: 'server-misconfigured' }, { status: 500 })
    }

    const body = await request.json().catch(() => null) as { email?: string; password?: string } | null

    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json({ error: 'invalid-payload' }, { status: 400 })
    }

    const email = body.email.trim().toLowerCase()
    const user = await prisma.adminUser.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
    }

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash)
    if (!passwordMatches) {
      return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
    }

    const role = normaliseAdminRole(user.role)

    const token = createAdminSessionToken({
      userId: user.id,
      email: user.email,
      role
    })

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role
      },
      expiresIn: DEFAULT_SESSION_TTL
    })

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DEFAULT_SESSION_TTL
    })

    return response
  } catch (error) {
    console.error('Admin login failed', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
