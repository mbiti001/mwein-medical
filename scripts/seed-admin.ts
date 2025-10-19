import path from 'node:path'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const ACCEPTED_ROLES = ['ADMIN', 'PHARMACY', 'CLINIC'] as const

type AcceptedRole = (typeof ACCEPTED_ROLES)[number]

function resolveRole(rawRole: string | undefined | null): AcceptedRole {
  const fallback: AcceptedRole = 'ADMIN'
  if (!rawRole) return fallback
  const candidate = rawRole.toUpperCase()
  return (ACCEPTED_ROLES as readonly string[]).includes(candidate)
    ? (candidate as AcceptedRole)
    : fallback
}

async function main() {
  const emailRaw = process.env.ADMIN_SEED_EMAIL ?? 'admin@mweinmed.com'
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMeNow!123'
  const role = resolveRole(process.env.ADMIN_SEED_ROLE)

  const email = emailRaw.trim().toLowerCase()
  if (!email) {
    throw new Error('ADMIN_SEED_EMAIL must be provided')
  }

  if (!password || password.length < 8) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 8 characters long')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      role
    },
    create: {
      email,
      passwordHash,
      role
    }
  })

  console.log(`✅ Admin user ready: ${admin.email} (${admin.role})`)
  console.log('ℹ️  Update ADMIN_SEED_PASSWORD in your environment after confirming the login.')
}

main()
  .catch(error => {
    console.error('Failed to seed admin user:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
