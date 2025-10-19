import { NextRequest, NextResponse } from 'next/server';
import { processMpesaCallback } from '../../../../lib/mpesa';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    await processMpesaCallback(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 });
  }
}