import {
  computeOverview,
  mapSupporter,
  recordSupporterContribution,
  sanitizeName,
  toTitleCase
} from './donations'
import { env } from './env'
import { prisma } from './prisma'

const TOKEN_BUFFER_MS = 60 * 1000

const MPESA_BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
} as const

type MpesaEnvironment = keyof typeof MPESA_BASE_URLS

type TokenCache = {
  token: string
  expiresAt: number
}

let cachedToken: TokenCache | null = null

export class MpesaConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MpesaConfigurationError'
  }
}

export class MpesaApiError extends Error {
  readonly responseCode?: string
  constructor(message: string, responseCode?: string) {
    super(message)
    this.name = 'MpesaApiError'
    this.responseCode = responseCode
  }
}

export class MpesaCallbackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MpesaCallbackError'
  }
}

export class MpesaInvalidPhoneError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MpesaInvalidPhoneError'
  }
}

export type MpesaTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export type InitiateMpesaDonationInput = {
  phone: string
  amount: number
  firstName: string
  accountReference?: string
  transactionDesc?: string
}

export type InitiateMpesaDonationResult = {
  paymentId: string
  checkoutRequestId?: string | null
  merchantRequestId?: string | null
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
}

export type MpesaCallbackMetadataItem = {
  Name?: string
  Value?: string | number
}

export type MpesaStkCallback = {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResultCode?: number
  ResultDesc?: string
  CallbackMetadata?: {
    Item?: MpesaCallbackMetadataItem[]
  }
}

export type MpesaCallbackPayload = {
  Body?: {
    stkCallback?: MpesaStkCallback
  }
}

function ensureConfig() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET  
  const passkey = process.env.MPESA_PASSKEY
  const shortCode = process.env.MPESA_SHORT_CODE
  const callbackUrl = process.env.MPESA_CALLBACK_URL
  const environment = process.env.MPESA_ENVIRONMENT || 'sandbox'
  
  if (!consumerKey || !consumerSecret || !passkey || !shortCode) {
    throw new MpesaConfigurationError('Missing MPesa Daraja credentials. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, and MPESA_SHORT_CODE.')
  }

  const envKey = (environment ?? 'sandbox') as MpesaEnvironment
  const baseUrl = MPESA_BASE_URLS[envKey]
  if (!baseUrl) {
    throw new MpesaConfigurationError(`Unsupported MPesa environment: ${environment}`)
  }

  return {
    consumerKey,
    consumerSecret,
    passkey,
    shortCode,
    callbackUrl,
    environment: envKey,
    baseUrl
  }
}

function buildTimestamp() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const YYYY = now.getFullYear()
  const MM = pad(now.getMonth() + 1)
  const DD = pad(now.getDate())
  const HH = pad(now.getHours())
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`
}

function buildPassword(shortCode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64')
}

function normalizePhoneNumber(input: string) {
  const digits = (input || '').replace(/\D/g, '')
  if (digits.length === 0) {
    throw new MpesaInvalidPhoneError('Phone number is required for MPesa donations.')
  }

  if (digits.startsWith('254') && digits.length === 12) {
    return digits
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `254${digits.slice(1)}`
  }

  if (digits.startsWith('7') && digits.length === 9) {
    return `254${digits}`
  }

  if (digits.startsWith('1') && digits.length === 9) {
    return `254${digits}`
  }

  if (digits.startsWith('254') && digits.length > 12) {
    return digits.slice(0, 12)
  }

  throw new MpesaInvalidPhoneError('Enter a valid Kenyan phone number in 07xx xxx xxx format.')
}

async function getOAuthToken(config: ReturnType<typeof ensureConfig>) {
  if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_BUFFER_MS) {
    return cachedToken.token
  }

  const url = `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  })

  const payload = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: string }

  if (!response.ok || !payload.access_token) {
    throw new MpesaApiError('Unable to obtain MPesa access token.')
  }

  const expiresInSeconds = Number(payload.expires_in ?? '3599')
  cachedToken = {
    token: payload.access_token,
    expiresAt: Date.now() + expiresInSeconds * 1000
  }

  return cachedToken.token
}

export async function initiateMpesaDonation(input: InitiateMpesaDonationInput): Promise<InitiateMpesaDonationResult> {
  const config = ensureConfig()

  const normalizedPhone = normalizePhoneNumber(input.phone)
  const amountCents = Math.round(input.amount * 100) // Convert to cents
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new MpesaApiError('Donation amount must be greater than zero.')
  }

  const firstName = toTitleCase(sanitizeName(input.firstName))
  if (!firstName) {
    throw new MpesaApiError('First name is required to initiate the donation.')
  }

  const accountReference = (input.accountReference ?? firstName).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12) || 'MWEINCARE'
  const transactionDesc = input.transactionDesc ?? 'Mwein Emergency Care Donation'

  const payment = await prisma.payment.create({
    data: {
      phoneE164: normalizedPhone,
      amountCents,
      status: 'PENDING'
    }
  })

  try {
    const token = await getOAuthToken(config)
    const timestamp = buildTimestamp()
    const password = buildPassword(config.shortCode, config.passkey, timestamp)

    const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: amountCents / 100, // Convert back to KES
        PartyA: normalizedPhone,
        PartyB: config.shortCode,
        PhoneNumber: normalizedPhone,
        CallBackURL: config.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      })
    })

    const payload = await response.json().catch(() => ({})) as {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResponseCode?: string
      ResponseDescription?: string
      CustomerMessage?: string
    }

    if (!response.ok || payload.ResponseCode !== '0') {
      const description = payload.ResponseDescription ?? 'MPesa rejected the STK push request.'
      throw new MpesaApiError(description, payload.ResponseCode)
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        merchantRequestId: payload.MerchantRequestID ?? '',
        checkoutRequestId: payload.CheckoutRequestID ?? '',
        resultCode: payload.ResponseCode ? parseInt(payload.ResponseCode) : null,
        resultDesc: payload.ResponseDescription ?? null
      }
    })

    return {
      paymentId: updated.id,
      checkoutRequestId: updated.checkoutRequestId,
      merchantRequestId: updated.merchantRequestId,
      status: updated.status as 'PENDING' | 'SUCCESS' | 'FAILED'
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown MPesa error.'
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        resultDesc: reason
      }
    })
    throw error
  }
}

function extractMetadataItems(callback?: MpesaStkCallback) {
  const items = callback?.CallbackMetadata?.Item ?? []
  const map = new Map<string, string | number | undefined>()
  items.forEach((entry: MpesaCallbackMetadataItem | undefined) => {
    if (entry?.Name) {
      map.set(entry.Name, entry.Value)
    }
  })
  return map
}

export async function processMpesaCallback(payload: MpesaCallbackPayload) {
  const callback = payload?.Body?.stkCallback
  if (!callback) {
    throw new MpesaCallbackError('Missing stkCallback payload.')
  }

  const checkoutRequestId = callback.CheckoutRequestID
  if (!checkoutRequestId) {
    throw new MpesaCallbackError('CheckoutRequestID is required.')
  }

  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId }
  })

  if (!payment) {
    throw new MpesaCallbackError(`No payment found for checkout request ${checkoutRequestId}.`)
  }

  if (payment.status === 'SUCCESS') {
    return { payment }
  }

  const metadataMap = extractMetadataItems(callback)
  const mpesaReceipt = typeof metadataMap.get('MpesaReceiptNumber') === 'string' ? (metadataMap.get('MpesaReceiptNumber') as string) : null
  const paidAmountRaw = metadataMap.get('Amount')
  const paidAmount = typeof paidAmountRaw === 'number' ? Math.round(paidAmountRaw * 100) : payment.amountCents

  const status = callback.ResultCode === 0 ? 'SUCCESS' : 'FAILED'

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      resultCode: callback.ResultCode != null ? callback.ResultCode : null,
      resultDesc: callback.ResultDesc ?? null,
      mpesaReceiptNumber: mpesaReceipt,
      txnDate: status === 'SUCCESS' ? new Date() : null
    }
  })

  if (status === 'FAILED') {
    return { payment: updated }
  }

  // Create Donation record
  const donation = await prisma.donation.create({
    data: {
      name: 'Anonymous',
      amountCents: paidAmount,
      paymentId: payment.id
    }
  })

  return {
    payment: updated,
    donation
  }
}

export async function getMpesaTransactionStatus(transactionId: string) {
  const transaction = await prisma.donationTransaction.findUnique({
    where: { id: transactionId },
    include: {
      supporter: true
    }
  })

  if (!transaction) {
    return null
  }

  const base = {
    id: transaction.id,
    status: transaction.status as MpesaTransactionStatus,
    resultDescription: transaction.resultDescription,
    failureReason: transaction.failureReason,
    mpesaReceiptNumber: transaction.mpesaReceiptNumber,
    checkoutRequestId: transaction.checkoutRequestId,
    merchantRequestId: transaction.merchantRequestId,
    supporterId: transaction.supporterId,
    amount: transaction.amount,
    firstName: transaction.firstName
  }

  if (transaction.status !== 'SUCCESS' || !transaction.supporterId) {
    return base
  }

  const overview = await computeOverview()

  return {
    ...base,
    supporter: transaction.supporter ? mapSupporter(transaction.supporter) : null,
    totals: overview.totals,
    recentNewSupporters: overview.recentNewSupporters
  }
}
