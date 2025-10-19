import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getMpesaTransactionStatus } from '../../../../../../lib/mpesa'

type RouteParams = {
  transactionId: string
}

const paramsSchema = z.object({
  transactionId: z.string().uuid({ message: 'Invalid transaction identifier' })
})

export async function GET(_request: Request, context: { params: RouteParams }) {
  try {
    const params = paramsSchema.parse(context.params)

    const transaction = await getMpesaTransactionStatus(params.transactionId)
    if (!transaction) {
      return NextResponse.json({ error: 'not-found' }, { status: 404 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid-transaction' }, { status: 400 })
    }

    console.error('Failed to load MPesa transaction status', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
