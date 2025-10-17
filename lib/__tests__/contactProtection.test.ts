import { describe, it, expect, beforeEach } from 'vitest'
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  checkRateLimit,
  identifyClient,
  resetRateLimits,
  shouldDropForHoneypot,
} from '../contactProtection'

describe('shouldDropForHoneypot', () => {
  it('drops when bot field contains content', () => {
    expect(shouldDropForHoneypot('spam')).toBe(true)
  })

  it('ignores undefined or whitespace', () => {
    expect(shouldDropForHoneypot(undefined)).toBe(false)
    expect(shouldDropForHoneypot('   ')).toBe(false)
  })
})

describe('identifyClient', () => {
  const makeHeaders = (values: Record<string, string | undefined>) => ({
    get: (name: string) => values[name.toLowerCase()] ?? null,
  })

  it('prefers first forwarded IP when available', () => {
    const headers = makeHeaders({ 'x-forwarded-for': '203.0.113.10, 10.0.0.5', 'x-real-ip': '198.51.100.8' })
    expect(identifyClient(headers)).toBe('203.0.113.10')
  })

  it('falls back to x-real-ip when forwarded is missing', () => {
    const headers = makeHeaders({ 'x-real-ip': '198.51.100.8' })
    expect(identifyClient(headers)).toBe('198.51.100.8')
  })

  it('returns "unknown" when no headers match', () => {
    const headers = makeHeaders({})
    expect(identifyClient(headers)).toBe('unknown')
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimits()
  })

  it('allows the first few submissions within the window', () => {
    const identifier = '203.0.113.10'
    for (let i = 0; i < RATE_LIMIT_MAX - 1; i++) {
      expect(checkRateLimit(identifier)).toBe(false)
    }
  })

  it('blocks once the limit is reached', () => {
    const identifier = '203.0.113.20'
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(identifier)
    }
    expect(checkRateLimit(identifier)).toBe(true)
  })

  it('resets after the window expires', () => {
    const identifier = '203.0.113.30'
    const start = 1_000
    // consume limit at start time
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(identifier, start)
    }
    expect(checkRateLimit(identifier, start + RATE_LIMIT_WINDOW_MS - 1)).toBe(true)

    // should clear once we pass the window
    expect(checkRateLimit(identifier, start + RATE_LIMIT_WINDOW_MS + 1)).toBe(false)
  })
})
