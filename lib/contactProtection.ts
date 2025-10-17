export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
export const RATE_LIMIT_MAX = 5

export type RateLimitEntry = {
  count: number
  expiresAt: number
}

type HeadersLike = {
  get(name: string): string | null
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export function shouldDropForHoneypot(botField: unknown): boolean {
  return typeof botField === 'string' && botField.trim().length > 0
}

export function identifyClient(headers: HeadersLike): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim()
    if (firstIp) {
      return firstIp
    }
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export function checkRateLimit(identifier: string, now = Date.now()): boolean {
  const entry = rateLimitMap.get(identifier)

  if (!entry || entry.expiresAt <= now) {
    rateLimitMap.set(identifier, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count += 1
  rateLimitMap.set(identifier, entry)
  return false
}

export function resetRateLimits(identifier?: string) {
  if (typeof identifier === 'string') {
    rateLimitMap.delete(identifier)
    return
  }

  rateLimitMap.clear()
}
