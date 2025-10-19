import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE = 'admin_session'

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET || '')
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  )
  return res
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // paths we guard: admin area and dashboard
  const isAdminPath = (pathname.startsWith('/admin') && pathname !== '/admin/login') || pathname.startsWith('/api/admin')
  const isDashboard = pathname.startsWith('/dashboard')

  if (!isAdminPath && !isDashboard) {
    return applySecurityHeaders(NextResponse.next())
  }

  const token = req.cookies.get(COOKIE)?.value
  if (!token) {
    const redirectTo = isAdminPath ? '/admin/login' : '/login'
    const res = NextResponse.redirect(new URL(redirectTo, req.url))
    return applySecurityHeaders(res)
  }

  try {
    await jwtVerify(token, getSecret())
    return applySecurityHeaders(NextResponse.next())
  } catch {
    const redirectTo = isAdminPath ? '/admin/login' : '/login'
    const res = NextResponse.redirect(new URL(redirectTo, req.url))
    return applySecurityHeaders(res)
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/dashboard/:path*']
}
