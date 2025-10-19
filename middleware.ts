import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE = 'admin_session'
const ISSUER = 'mwein-medical'
const AUD = 'admin'

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
  const guarded =
    (pathname.startsWith('/admin') && pathname !== '/admin/login') || pathname.startsWith('/api/admin')

  if (guarded) {
    const token = req.cookies.get(COOKIE)?.value
    if (!token) {
      const redir = NextResponse.redirect(new URL('/admin/login', req.url))
      return applySecurityHeaders(redir)
    }

    try {
      await jwtVerify(token, getSecret(), { issuer: ISSUER, audience: AUD })
      const nextRes = NextResponse.next()
      return applySecurityHeaders(nextRes)
    } catch {
      const redir = NextResponse.redirect(new URL('/admin/login', req.url))
      return applySecurityHeaders(redir)
    }
  }

  const nextRes = NextResponse.next()
  return applySecurityHeaders(nextRes)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/((?!_next|.*\\..*).*)']
}
