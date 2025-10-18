import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const findUniqueMock = vi.fn()
const upsertMock = vi.fn()

vi.mock('../../../../lib/prisma', () => ({
	prisma: {
		siteMetric: {
			findUnique: findUniqueMock,
			upsert: upsertMock
		}
	}
}))

describe('GET /api/metrics/visitors', () => {
	beforeEach(() => {
		findUniqueMock.mockReset()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns zero when no metric exists yet', async () => {
		findUniqueMock.mockResolvedValue(null)

		const { GET } = await import('./route')
		const response = await GET()
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data).toEqual({ count: 0 })
	})

	it('returns stored count when present', async () => {
		findUniqueMock.mockResolvedValue({ key: 'donation_page_visitors', count: 42 })

		const { GET } = await import('./route')
		const response = await GET()
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data).toEqual({ count: 42 })
	})
})

describe('POST /api/metrics/visitors', () => {
	beforeEach(() => {
		upsertMock.mockReset()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('increments the visitor counter and returns the latest tally', async () => {
		upsertMock.mockResolvedValue({ key: 'donation_page_visitors', count: 101 })

		const { POST } = await import('./route')
		const response = await POST()
		const data = await response.json()

		expect(upsertMock).toHaveBeenCalledWith({
			where: { key: 'donation_page_visitors' },
			create: { key: 'donation_page_visitors', count: 1 },
			update: { count: { increment: 1 } }
		})
		expect(response.status).toBe(200)
		expect(data).toEqual({ count: 101 })
	})
})
