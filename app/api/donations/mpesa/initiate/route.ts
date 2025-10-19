import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  initiateMpesaDonation,
  MpesaApiError,
  MpesaConfigurationError,
  MpesaInvalidPhoneError
} from '../../../../../lib/mpesa'

const initiateSchema = z.object({
  phone: z.string().min(7, 'Phone number is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  firstName: z.string().min(1, 'First name is required').max(80, 'First name is too long'),
  accountReference: z.string().optional(),
  transactionDesc: z.string().optional()
})

export async function POST(request: Request) {
  try {
    const payload = initiateSchema.parse(await request.json())
    const transaction = await initiateMpesaDonation(payload)

    return NextResponse.json({
      transaction
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid-payload', details: error.flatten() }, { status: 400 })
    }

    if (error instanceof MpesaInvalidPhoneError) {
      return NextResponse.json({ error: 'invalid-phone', message: error.message }, { status: 400 })
    }

    if (error instanceof MpesaApiError) {
      return NextResponse.json({ error: 'mpesa', message: error.message, code: error.responseCode ?? null }, { status: 502 })
    }

    if (error instanceof MpesaConfigurationError) {
      return NextResponse.json({ error: 'configuration', message: error.message }, { status: 500 })
    }

    console.error('Failed to initiate MPesa donation', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
