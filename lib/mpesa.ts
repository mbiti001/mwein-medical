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
  transactionId: string
  checkoutRequestId?: string | null
  merchantRequestId?: string | null
  status: MpesaTransactionStatus
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
  const amount = Math.round(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new MpesaApiError('Donation amount must be greater than zero.')
  }

  const firstName = toTitleCase(sanitizeName(input.firstName))
  if (!firstName) {
    throw new MpesaApiError('First name is required to initiate the donation.')
  }

  const accountReference = (input.accountReference ?? firstName).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12) || 'MWEINCARE'
  const transactionDesc = input.transactionDesc ?? 'Mwein Emergency Care Donation'

  const transaction = await prisma.donationTransaction.create({
    data: {
      phone: input.phone,
      normalizedPhone,
      amount,
      firstName,
      accountReference,
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
        Amount: amount,
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

    const updated = await prisma.donationTransaction.update({
      where: { id: transaction.id },
      data: {
        merchantRequestId: payload.MerchantRequestID ?? null,
        checkoutRequestId: payload.CheckoutRequestID ?? null,
        resultCode: payload.ResponseCode ?? null,
        resultDescription: payload.ResponseDescription ?? null
      }
    })

    return {
      transactionId: updated.id,
      checkoutRequestId: updated.checkoutRequestId,
      merchantRequestId: updated.merchantRequestId,
      status: updated.status as MpesaTransactionStatus
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown MPesa error.'
    await prisma.donationTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        failureReason: reason
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

  const transaction = await prisma.donationTransaction.findUnique({
    where: { checkoutRequestId }
  })

  if (!transaction) {
    throw new MpesaCallbackError(`No donation transaction found for checkout request ${checkoutRequestId}.`)
  }

  if (transaction.status === 'SUCCESS') {
    return { transaction }
  }

  const metadataMap = extractMetadataItems(callback)
  const mpesaReceipt = typeof metadataMap.get('MpesaReceiptNumber') === 'string' ? (metadataMap.get('MpesaReceiptNumber') as string) : null
  const paidAmountRaw = metadataMap.get('Amount')
  const paidAmount = typeof paidAmountRaw === 'number' ? Math.round(paidAmountRaw) : transaction.amount

  const status: MpesaTransactionStatus = callback.ResultCode === 0 ? 'SUCCESS' : 'FAILED'
  const failureReason = status === 'FAILED' ? (callback.ResultDesc ?? 'MPesa declined the payment.') : null

  const updated = await prisma.donationTransaction.update({
    where: { id: transaction.id },
    data: {
      status,
      resultCode: callback.ResultCode != null ? String(callback.ResultCode) : null,
      resultDescription: callback.ResultDesc ?? null,
      mpesaReceiptNumber: mpesaReceipt,
      failureReason,
  callbackMetadata: callback.CallbackMetadata ? JSON.stringify(callback.CallbackMetadata) : null
    }
  })

  if (status === 'FAILED') {
    return { transaction: updated }
  }

  try {
    const contribution = await recordSupporterContribution({
      firstName: transaction.firstName,
      amount: paidAmount,
      channel: 'M-Pesa',
      shareConsent: 'pending'
    })

    const finalTransaction = await prisma.donationTransaction.update({
      where: { id: transaction.id },
      data: {
        supporterId: contribution.supporter.id
      }
    })

    return {
      transaction: finalTransaction,
      supporter: contribution.supporter,
      totals: contribution.totals,
      recentNewSupporters: contribution.recentNewSupporters
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unable to log supporter contribution.'
    await prisma.donationTransaction.update({
      where: { id: transaction.id },
      data: {
        failureReason: reason
      }
    })
    throw error
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
