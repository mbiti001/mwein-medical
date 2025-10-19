import { beforeEach, describe, expect, it, vi } from 'vitest'

const createMock = vi.fn()
const sendEmailMock = vi.fn()
const identifyClientMock = vi.fn(() => '198.51.100.10')
const honeypotMock = vi.fn(() => false)
const rateLimitMock = vi.fn(() => false)

vi.mock('../../../lib/prisma', () => ({
	prisma: {
		antifraudReport: {
			create: createMock
		}
	}
}))

vi.mock('../../../lib/email', () => ({
	sendEmail: sendEmailMock
}))

vi.mock('../../../lib/contactProtection', () => ({
	identifyClient: identifyClientMock,
	shouldDropForHoneypot: honeypotMock,
	checkRateLimit: rateLimitMock
}))

describe('POST /api/antifraud', () => {
	beforeEach(() => {
		createMock.mockReset()
		sendEmailMock.mockReset()
		rateLimitMock.mockReset()
		honeypotMock.mockReset()
		identifyClientMock.mockReset()
		identifyClientMock.mockReturnValue('198.51.100.10')
		rateLimitMock.mockReturnValue(false)
		honeypotMock.mockReturnValue(false)
		sendEmailMock.mockResolvedValue({ status: 'sent', messageId: 'msg-1', recipient: 'mweinmedical@gmail.com' })
	})

	it('persists a valid report and notifies the admin inbox', async () => {
		const createdAt = new Date('2025-10-18T09:00:00Z')
		const reportRecord = {
			id: 'af-1',
			reporterAlias: 'Concerned Patient',
			reporterContact: '0722000000',
			suspectName: 'Jane Clinician',
			suspectPhone: '0711999777',
			transactionAmount: 4500,
			transactionReason: 'Cash requested to fast-track lab work',
			transactionDate: new Date('2025-10-17T00:00:00Z'),
			evidenceSummary: 'Shared screenshots of M-Pesa confirmation and WhatsApp thread.',
			evidenceUrl: 'https://files.example.com/evidence',
			identifier: '198.51.100.10',
			status: 'NEW',
			createdAt,
			updatedAt: createdAt
		}

		createMock.mockResolvedValue(reportRecord)

		const { POST } = await import('./route')
		const response = await POST(
			new Request('http://localhost/api/antifraud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reporterAlias: '  Concerned Patient  ',
					reporterContact: '0722000000',
					suspectName: ' Jane Clinician ',
					suspectPhone: ' 0711999777 ',
					transactionAmount: '4,500',
					transactionDate: '2025-10-17',
					transactionReason: 'Cash requested to fast-track lab work',
					evidenceSummary: 'Shared screenshots of M-Pesa confirmation and WhatsApp thread.',
					evidenceUrl: 'https://files.example.com/evidence',
					botField: ''
				})
			})
		)

		const payload = await response.json()

		expect(response.status).toBe(200)
		expect(payload).toEqual({ ok: true, id: 'af-1' })

		const createCall = createMock.mock.calls[0]?.[0]
		expect(createCall?.data).toMatchObject({
			reporterAlias: 'Concerned Patient',
			reporterContact: '0722000000',
			suspectName: 'Jane Clinician',
			suspectPhone: '0711999777',
			transactionAmount: 4500,
			transactionReason: 'Cash requested to fast-track lab work',
			evidenceSummary: 'Shared screenshots of M-Pesa confirmation and WhatsApp thread.',
			evidenceUrl: 'https://files.example.com/evidence',
			identifier: '198.51.100.10'
		})
		expect(createCall?.data.transactionDate).toBeInstanceOf(Date)
		expect(createCall?.data.transactionDate?.toISOString()).toBe('2025-10-17T00:00:00.000Z')
		expect(sendEmailMock).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'mweinmedical@gmail.com',
				subject: expect.stringContaining('Antifraud alert')
			})
		)
	})

	it('ignores submissions that trip the honeypot', async () => {
		honeypotMock.mockReturnValue(true)

		const { POST } = await import('./route')
		const response = await POST(
			new Request('http://localhost/api/antifraud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ botField: 'spammy' })
			})
		)

		const payload = await response.json()

		expect(response.status).toBe(200)
		expect(payload).toEqual({ ok: true })
		expect(createMock).not.toHaveBeenCalled()
	})

	it('enforces rate limiting', async () => {
		rateLimitMock.mockReturnValue(true)

		const { POST } = await import('./route')
		const response = await POST(
			new Request('http://localhost/api/antifraud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			})
		)

		expect(response.status).toBe(429)
		expect(createMock).not.toHaveBeenCalled()
	})

	it('returns validation errors for incomplete payloads', async () => {
		const { POST } = await import('./route')
		const response = await POST(
			new Request('http://localhost/api/antifraud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					suspectName: '',
					suspectPhone: '',
					transactionAmount: '',
					transactionReason: '',
					evidenceSummary: ''
				})
			})
		)

		expect(response.status).toBe(422)
		const payload = await response.json()
		expect(payload).toHaveProperty('error', 'invalid')
	})
})
