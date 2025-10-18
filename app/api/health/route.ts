import { NextResponse } from 'next/server'

import { env } from '../../../lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
	return NextResponse.json({
		ok: true,
		time: new Date().toISOString(),
		vercelEnv: process.env.VERCEL_ENV ?? null,
		node: process.version,
		dbConfigured: Boolean(process.env.DATABASE_URL),
		siteUrl: env.siteUrl
	})
}
