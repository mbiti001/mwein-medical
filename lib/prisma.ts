import { PrismaClient } from '@prisma/client'

declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined
}

const datasourceUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'

if (!process.env.DATABASE_URL) {
	process.env.DATABASE_URL = datasourceUrl
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
