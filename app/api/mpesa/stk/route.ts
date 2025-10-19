import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initiateMpesaDonation } from '@/lib/mpesa';

const stkPushSchema = z.object({
  phone: z.string().min(10).max(15),
  amount: z.number().min(1),
  firstName: z.string().min(1),
  accountReference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, amount, firstName, accountReference } = stkPushSchema.parse(body);

    // Initiate M-Pesa STK push
    const result = await initiateMpesaDonation({
      phone,
      amount,
      firstName,
      accountReference,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('STK Push error:', error);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}