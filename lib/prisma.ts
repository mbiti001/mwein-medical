import { PrismaClient } from '@prisma/client'

import { env } from './env'

declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined
}

const datasourceUrl = env.DATABASE_URL

if (!process.env.DATABASE_URL) {
	process.env.DATABASE_URL = datasourceUrl
}

if (!process.env.DATABASE_PROVIDER) {
	process.env.DATABASE_PROVIDER = env.DATABASE_PROVIDER
}

export const prisma =
	global.prisma ??
	new PrismaClient({
		datasources: {
			db: {
				url: datasourceUrl
			}
		}
	})

if (process.env.NODE_ENV !== 'production') {
	global.prisma = prisma
}
