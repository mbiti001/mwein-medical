import { beforeEach, describe, expect, it, vi } from 'vitest'

const findManyMock = vi.fn()
const aggregateMock = vi.fn()
const countMock = vi.fn()
const upsertMock = vi.fn()
const updateMock = vi.fn()

vi.mock('../../../../lib/prisma', () => ({
	prisma: {
		donationSupporter: {
			findMany: findManyMock,
			aggregate: aggregateMock,
			count: countMock,
			upsert: upsertMock,
			update: updateMock
		}
	}
}))

describe('/api/donations/supporters', () => {
	beforeEach(() => {
		findManyMock.mockReset()
		aggregateMock.mockReset()
		countMock.mockReset()
		upsertMock.mockReset()
		updateMock.mockReset()
	})

	describe('GET', () => {
		it('returns supporters and totals snapshot', async () => {
			const now = new Date()
			const todayIso = now.toISOString().slice(0, 10)
			findManyMock
				.mockResolvedValueOnce([
				{
					id: '1',
					firstName: 'Amina',
					normalizedName: 'amina',
					totalAmount: 3000,
					donationCount: 3,
					lastChannel: 'M-Pesa',
					lastContributionAt: now,
					publicAcknowledgement: true,
					createdAt: now,
					updatedAt: now
				},
				{
					id: '2',
					firstName: 'Brian',
					normalizedName: 'brian',
					totalAmount: 1500,
					donationCount: 2,
					lastChannel: 'PayPal',
					lastContributionAt: null,
					publicAcknowledgement: false,
					createdAt: now,
					updatedAt: now
				}
				])
				.mockResolvedValueOnce([
					{ createdAt: now },
					{ createdAt: new Date(now.getTime() - 60 * 1000) }
				])
			aggregateMock.mockResolvedValue({
				_sum: { totalAmount: 4500, donationCount: 5 },
				_count: { _all: 2 }
			})
			countMock
				.mockResolvedValueOnce(1) // public supporters
				.mockResolvedValueOnce(1) // active supporters
				.mockResolvedValueOnce(1) // new supporters

			const { GET } = await import('./route')
			const response = await GET()
			const body = await response.json()

			expect(response.status).toBe(200)
			expect(body.supporters).toEqual([
				{
					id: '1',
					firstName: 'Amina',
					totalAmount: 3000,
					donationCount: 3,
					lastChannel: 'M-Pesa',
					lastContributionAt: now.toISOString(),
					publicAcknowledgement: true
				},
				{
					id: '2',
					firstName: 'Brian',
					totalAmount: 1500,
					donationCount: 2,
					lastChannel: 'PayPal',
					lastContributionAt: null,
					publicAcknowledgement: false
				}
			])
			expect(body.totals).toEqual({
				totalAmount: 4500,
				totalGifts: 5,
				totalSupporters: 2,
				publicSupporters: 1,
				activeSupporters: 1,
				newSupporters: 1
			})
				expect(body.recentNewSupporters).toHaveLength(30)
				expect(body.recentNewSupporters.at(-1)).toEqual({
					date: todayIso,
					newSupporters: 2
				})
		})
	})

	describe('POST', () => {
		it('upserts supporter and returns updated totals', async () => {
				const now = new Date()
			upsertMock.mockResolvedValue({
				id: 'abc',
				firstName: 'Amina',
				normalizedName: 'amina',
				totalAmount: 4200,
				donationCount: 4,
				lastChannel: 'M-Pesa',
				lastContributionAt: now,
				publicAcknowledgement: false,
				createdAt: now,
				updatedAt: now
			})
			aggregateMock.mockResolvedValue({
				_sum: { totalAmount: 4200, donationCount: 4 },
				_count: { _all: 1 }
			})
			countMock
				.mockResolvedValueOnce(0) // public supporters
				.mockResolvedValueOnce(1) // active supporters
				.mockResolvedValueOnce(1) // new supporters
			findManyMock.mockResolvedValueOnce([{ createdAt: now }])

			const { POST } = await import('./route')
			const response = await POST(
				new Request('http://localhost/api/donations/supporters', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ firstName: 'amina', amount: 1200, channel: 'M-Pesa' })
				})
			)

			expect(response.status).toBe(200)
			const call = upsertMock.mock.calls[0][0]
			expect(call.where).toEqual({ normalizedName: 'amina' })
			expect(call.create.firstName).toBe('Amina')
			expect(call.create.normalizedName).toBe('amina')
			expect(call.create.totalAmount).toBe(1200)
			expect(call.create.donationCount).toBe(1)
			expect(call.create.lastChannel).toBe('M-Pesa')
			expect(call.create.publicAcknowledgement).toBe(false)
			expect(call.create.lastContributionAt).toBeInstanceOf(Date)
			expect(call.update.firstName).toBe('Amina')
			expect(call.update.totalAmount).toEqual({ increment: 1200 })
			expect(call.update.donationCount).toEqual({ increment: 1 })
			expect(call.update.lastChannel).toBe('M-Pesa')
			expect(call.update.lastContributionAt).toBeInstanceOf(Date)

			const body = await response.json()
			expect(body.supporter).toEqual({
				id: 'abc',
				firstName: 'Amina',
				totalAmount: 4200,
				donationCount: 4,
				lastChannel: 'M-Pesa',
				lastContributionAt: now.toISOString(),
				publicAcknowledgement: false
			})
			expect(body.totals).toEqual({
				totalAmount: 4200,
				totalGifts: 4,
				totalSupporters: 1,
				publicSupporters: 0,
				activeSupporters: 1,
				newSupporters: 1
			})
			expect(body.recentNewSupporters.at(-1)?.newSupporters).toBe(1)
		})
	})

	describe('PATCH', () => {
		it('updates supporter acknowledgement preference', async () => {
			const now = new Date()
			updateMock.mockResolvedValue({
				id: 'abc',
				firstName: 'Amina',
				normalizedName: 'amina',
				totalAmount: 4800,
				donationCount: 5,
				lastChannel: 'PayPal',
				lastContributionAt: now,
				publicAcknowledgement: true,
				createdAt: now,
				updatedAt: now
			})
			aggregateMock.mockResolvedValue({
				_sum: { totalAmount: 4800, donationCount: 5 },
				_count: { _all: 1 }
			})
			countMock
				.mockResolvedValueOnce(1) // public supporters
				.mockResolvedValueOnce(1) // active supporters
				.mockResolvedValueOnce(0) // new supporters
			findManyMock.mockResolvedValueOnce([])

			const { PATCH } = await import('./route')
			const response = await PATCH(
				new Request('http://localhost/api/donations/supporters', {
					method: 'PATCH',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ supporterId: '11111111-1111-4111-8111-111111111111', shareConsent: 'granted' })
				})
			)

			const payload = await response.json()
			expect(response.status, JSON.stringify(payload)).toBe(200)
			expect(updateMock).toHaveBeenCalledWith({
				where: { id: '11111111-1111-4111-8111-111111111111' },
				data: { publicAcknowledgement: true }
			})

			expect(payload.supporter.publicAcknowledgement).toBe(true)
			expect(payload.totals.publicSupporters).toBe(1)
			expect(payload.recentNewSupporters).toHaveLength(30)
		})

		it('returns 404 when supporter is missing', async () => {
			updateMock.mockRejectedValue({ code: 'P2025' })

			const { PATCH } = await import('./route')
			const response = await PATCH(
				new Request('http://localhost/api/donations/supporters', {
					method: 'PATCH',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ supporterId: '22222222-2222-4222-8222-222222222222', shareConsent: 'declined' })
				})
			)

			const payload = await response.json()
			expect(response.status, JSON.stringify(payload)).toBe(404)
			expect(payload).toEqual({ error: 'not-found' })
		})
	})
})
