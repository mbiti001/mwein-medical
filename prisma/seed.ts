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

  // Create sample payments and donations
  console.log('� Creating sample payments and donations...')
  
  const samplePayments = [
    { phoneE164: '+254712345001', amountCents: 200000, status: 'COMPLETED', merchantRequestId: 'MRQ001', checkoutRequestId: 'CRQ001' },
    { phoneE164: '+254712345002', amountCents: 50000, status: 'COMPLETED', merchantRequestId: 'MRQ002', checkoutRequestId: 'CRQ002' },
    { phoneE164: '+254712345003', amountCents: 100000, status: 'COMPLETED', merchantRequestId: 'MRQ003', checkoutRequestId: 'CRQ003' },
    { phoneE164: '+254712345004', amountCents: 350000, status: 'COMPLETED', merchantRequestId: 'MRQ004', checkoutRequestId: 'CRQ004' },
    { phoneE164: '+254712345005', amountCents: 75000, status: 'COMPLETED', merchantRequestId: 'MRQ005', checkoutRequestId: 'CRQ005' },
  ]

  const payments = []
  for (const pay of samplePayments) {
    const existing = await prisma.payment.findUnique({
      where: { checkoutRequestId: pay.checkoutRequestId }
    })
    if (!existing) {
      const payment = await prisma.payment.create({
        data: {
          ...pay,
          createdAt: randomRecentDate(30)
        }
      })
      payments.push(payment)
    } else {
      payments.push(existing)
    }
  }

    const sampleDonations = [
    { name: 'Local Mama Group', amountCents: 200000 },
    { name: 'Busia Family', amountCents: 50000 },
    { name: 'Anonymous Donor', amountCents: 100000 },
    { name: 'Market Traders Assoc.', amountCents: 350000 },
    { name: 'St. Martha Youth', amountCents: 75000 },
  ]

  for (let i = 0; i < sampleDonations.length; i++) {
    const don = sampleDonations[i]
    const payment = payments[i]
    const existing = await prisma.donation.findFirst({
      where: { name: don.name, paymentId: payment.id }
    })
    if (!existing) {
      await prisma.donation.create({
        data: {
          ...don,
          paymentId: payment.id,
          createdAt: randomRecentDate(30)
        }
      })
    }
  }

  for (const don of sampleDonations) {
    const existing = await prisma.donation.findFirst({
      where: { name: don.name, paymentId: payments[sampleDonations.indexOf(don)].id }
    })
    if (!existing) {
      await prisma.donation.create({
        data: {
          ...don,
          paymentId: payments[sampleDonations.indexOf(don)].id,
          createdAt: randomRecentDate(30)
        }
      })
    }
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