import { NextResponse } from 'next/server'

import {
  MpesaCallbackError,
  MpesaCallbackPayload,
  processMpesaCallback
} from '../../../../../lib/mpesa'
import { env } from '../../../../../lib/env'

const CALLBACK_SECRET_HEADER = 'x-mpesa-callback-secret'

export async function POST(request: Request) {
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET?.trim()
  if (expectedSecret) {
    const provided = request.headers.get(CALLBACK_SECRET_HEADER) || request.headers.get('X-Mpesa-Callback-Secret')
    if (!provided || provided !== expectedSecret) {
      console.warn('MPesa callback rejected due to missing or invalid shared secret')
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  let payload: MpesaCallbackPayload

  try {
    payload = (await request.json()) as MpesaCallbackPayload
  } catch (error) {
    console.error('Failed to parse MPesa callback payload', error)
    return NextResponse.json({ error: 'invalid-payload' }, { status: 400 })
  }

  try {
    const result = await processMpesaCallback(payload)
    return NextResponse.json({
      ok: true,
      status: result.payment.status,
      paymentId: result.payment.id,
      donationId: result.donation?.id ?? null
    })
  } catch (error) {
    if (error instanceof MpesaCallbackError) {
      console.error('MPesa callback error', error.message)
    } else {
      console.error('Unexpected MPesa callback failure', error)
    }

    // Safaricom expects a 200 OK acknowledgement even when we fail internally to avoid repeated retries
    return NextResponse.json({ ok: false })
  }
}
