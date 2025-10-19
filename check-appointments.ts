import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAppointments() {
  try {
    const appointments = await prisma.appointmentRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        preferredDate: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('📋 Latest Appointment Records:');
    console.log('==============================');
    
    if (appointments.length === 0) {
      console.log('No appointments found in database.');
    } else {
      appointments.forEach((apt, index) => {
        console.log(`${index + 1}. ${apt.name} (${apt.phone})`);
        console.log(`   📅 Date: ${apt.preferredDate}`);
        console.log(`   📊 Status: ${apt.status}`);
        console.log(`   🆔 ID: ${apt.id}`);
        console.log(`   ⏰ Created: ${new Date(apt.createdAt).toLocaleString()}`);
        console.log('');
      });
    }
    
    console.log(`✅ Total appointments in database: ${appointments.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppointments();