import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()

vi.mock('../../../../lib/prisma', () => ({
	prisma: {
		exitFeedback: {
			create: createMock
		}
	}
}))

describe('POST /api/feedback/exit-intent', () => {
	beforeEach(() => {
		createMock.mockReset()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('persists affirmative feedback without requiring explanation', async () => {
		createMock.mockResolvedValue({ id: 'feedback_123' })

		const request = new Request('http://localhost/api/feedback/exit-intent', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ outcome: 'FOUND', pagePath: '/services/telehealth' })
		})

		const { POST } = await import('./route')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(201)
		expect(createMock).toHaveBeenCalledWith({
			data: {
				outcome: 'FOUND',
				explanation: null,
				email: null,
				pagePath: '/services/telehealth'
			}
		})
		expect(data).toEqual({ ok: true, id: 'feedback_123' })
	})

	it('returns 400 when explanation is missing for unresolved visits', async () => {
		const request = new Request('http://localhost/api/feedback/exit-intent', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ outcome: 'NOT_FOUND' })
		})

		const { POST } = await import('./route')
		const response = await POST(request)
		const payload = await response.json()

		expect(response.status).toBe(400)
		expect(payload).toMatchObject({ error: 'invalid' })
		expect(createMock).not.toHaveBeenCalled()
	})

	it('returns 500 when persistence fails', async () => {
		createMock.mockRejectedValue(new Error('database unavailable'))

		const request = new Request('http://localhost/api/feedback/exit-intent', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				outcome: 'OTHER',
				explanation: 'Wanted ambulance rates',
				email: 'family@example.com'
			})
		})

		const { POST } = await import('./route')
		const response = await POST(request)
		const body = await response.json()

		expect(response.status).toBe(500)
		expect(body).toEqual({ error: 'server' })
		expect(createMock).toHaveBeenCalled()
	})
})
