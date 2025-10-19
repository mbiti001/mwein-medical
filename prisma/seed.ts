import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/** Deterministic RNG (Mulberry32) so seeds are repeatable */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(254) // any fixed seed

/** Random date within the last N days, biased to 08:00–18:00 Africa/Nairobi */
function randomRecentDate(days = 30) {
  const now = new Date()
  const offsetDays = Math.floor(rand() * days)
  const d = new Date(now)
  d.setDate(now.getDate() - offsetDays)
  // Business-hour window
  const hour = 8 + Math.floor(rand() * 10) // 08:00–18:00
  const minute = Math.floor(rand() * 60)
  d.setHours(hour, minute, 0, 0)
  return d
}

async function main() {
  // Guard rails: don't accidentally wipe production
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Refusing to run seed in production. Set ALLOW_SEED=true to override.')
  }

  // Create admin user first
  console.log('🔧 Creating admin user...')
  
  const bcrypt = require('bcryptjs')
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@mweinmedical.co.ke'
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'MweinAdmin123!'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'ADMIN'
    }
  })

  // Create sample appointment requests
  console.log('📋 Creating sample appointments...')
  
  const sampleAppointments = [
    {
      name: 'Mary Wanjiku',
      phone: '+254712345001',
      email: 'mary@example.com',
      preferredDate: '2025-10-25',
      preferredTime: '09:00',
      reason: 'Antenatal checkup - 32 weeks pregnant',
      consultationType: 'IN_PERSON',
      status: 'CONFIRMED'
    },
    {
      name: 'John Kiprotich',
      phone: '+254712345002',
      preferredDate: '2025-10-26',
      preferredTime: '14:00',
      reason: 'Child wellness clinic - 6 month old',
      consultationType: 'IN_PERSON',
      status: 'NEW'
    },
    {
      name: 'Grace Akinyi',
      phone: '+254712345003',
      email: 'grace@example.com',
      preferredDate: '2025-10-27',
      preferredTime: '11:00',
      reason: 'Telehealth consultation for diabetes management',
      consultationType: 'TELEHEALTH',
      status: 'NEW'
    }
  ]

  for (const apt of sampleAppointments) {
    // Check if appointment already exists
    const existing = await prisma.appointmentRequest.findFirst({
      where: { phone: apt.phone }
    })
    
    if (!existing) {
      await prisma.appointmentRequest.create({
        data: apt
      })
    }
  }

  // Create sample donation supporters
  console.log('💝 Creating donation supporters...')
  
  const supporters = [
    { name: 'Local Mama Group', amount: 2000, message: 'For maternal kits' },
    { name: 'Busia Family', amount: 500,  message: 'Keeping care close' },
    { name: 'Anonymous Donor', amount: 1000, message: 'Oxygen for kids' },
    { name: 'Market Traders Assoc.', amount: 3500, message: 'Community health drive' },
    { name: 'St. Martha Youth', amount: 750, message: 'Child clinic support' },
  ]

  for (const supporter of supporters) {
    const normalizedName = supporter.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    await prisma.donationSupporter.upsert({
      where: { normalizedName },
      update: {},
      create: {
        firstName: supporter.name,
        normalizedName,
        totalAmount: supporter.amount,
        donationCount: 1,
        lastChannel: 'MANUAL',
        lastContributionAt: randomRecentDate(30),
        publicAcknowledgement: true
      }
    })
  }

  console.log('✅ Seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })