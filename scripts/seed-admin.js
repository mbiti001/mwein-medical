/* eslint-disable no-console, @typescript-eslint/no-var-requires */
const path = require('path')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')

const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const prisma = new PrismaClient()

const VALID_ROLES = ['ADMIN', 'PHARMACY', 'CLINIC']

async function main() {
  const emailRaw = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD
  const roleRaw = (process.env.ADMIN_SEED_ROLE || 'ADMIN').toUpperCase()

  if (!emailRaw || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in your environment')
  }

  const email = emailRaw.trim().toLowerCase()
  const role = VALID_ROLES.includes(roleRaw) ? roleRaw : 'ADMIN'

  const passwordHash = await bcrypt.hash(password, 12)

  const result = await prisma.adminUser.upsert({
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

  console.log(`✅ Admin user ready: ${result.email} (${result.role})`)
  console.log('Password hash stored in database. Update environment variables to remove plaintext password if desired.')
}

main()
  .catch(error => {
    console.error('Failed to seed admin user:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
