import { NextResponse } from 'next/server'

export async function DELETE() {
  const res = NextResponse.json({ ok: true })

  // Clear the admin-session cookie by setting empty value and maxAge 0
  res.cookies.set({
    name: 'admin_session',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return res
}

