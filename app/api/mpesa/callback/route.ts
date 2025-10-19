import { NextRequest, NextResponse } from 'next/server';
import { handleMpesaCallback } from '@/lib/mpesa';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    await handleMpesaCallback(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 });
  }
}