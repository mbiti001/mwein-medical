import { beforeEach, describe, expect, it, vi } from 'vitest'

const findManyMock = vi.fn()
const getAuthenticatedAdminMock = vi.fn()
const hasRequiredRoleMock = vi.fn()

vi.mock('../../../../lib/prisma', () => ({
	prisma: {
		orderNotification: {
			findMany: findManyMock
		}
	}
}))

vi.mock('../../../../lib/authServer', () => ({
	getAuthenticatedAdmin: getAuthenticatedAdminMock,
	hasRequiredRole: hasRequiredRoleMock
}))

describe('/api/orders/notifications', () => {
	beforeEach(() => {
		findManyMock.mockReset()
		getAuthenticatedAdminMock.mockReset()
		hasRequiredRoleMock.mockReset()
	})

	describe('GET', () => {
		it('returns 401 when admin is missing', async () => {
			getAuthenticatedAdminMock.mockResolvedValue(null)

			const { GET } = await import('./route')
			const response = await GET()
			const payload = await response.json()

			expect(response.status).toBe(401)
			expect(payload).toEqual({ error: 'unauthorised' })
			expect(findManyMock).not.toHaveBeenCalled()
		})

		it('returns recent notifications for authorised admins', async () => {
			const now = new Date('2025-10-18T13:40:00.000Z')

			getAuthenticatedAdminMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
			hasRequiredRoleMock.mockReturnValue(true)
			findManyMock.mockResolvedValue([
				{
					id: 'notif-1',
					channel: 'EMAIL',
					status: 'SENT',
					recipient: 'pharmacy@mweinmedical.co.ke',
					summary: 'Email sent to pharmacy@mweinmedical.co.ke',
					metadataJson: JSON.stringify({ messageId: '123' }),
					createdAt: now,
					deliveredAt: now,
					order: {
						reference: 'ORD-123456',
						customerName: 'Grace'
					}
				}
			])

			const { GET } = await import('./route')
			const response = await GET()
			const payload = await response.json()

			expect(response.status).toBe(200)
			expect(findManyMock).toHaveBeenCalledWith({
				orderBy: [{ createdAt: 'desc' }],
				take: 12,
				include: {
					order: {
						select: {
							reference: true,
							customerName: true
						}
					}
				}
			})
			expect(payload).toEqual({
				notifications: [
					{
						id: 'notif-1',
						orderReference: 'ORD-123456',
						customerName: 'Grace',
						channel: 'EMAIL',
						status: 'SENT',
						recipient: 'pharmacy@mweinmedical.co.ke',
						summary: 'Email sent to pharmacy@mweinmedical.co.ke',
						createdAt: now.toISOString(),
						deliveredAt: now.toISOString()
					}
				]
			})
		})
	})
})
