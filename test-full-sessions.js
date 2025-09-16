import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testFullSessions() {
  const examDate = new Date('2025-09-27T00:00:00.000Z');

  console.log('🧪 Testing: Both sessions FULL (Advanced 300 each)');
  console.log('Expected: Sessions should show "เต็มแล้ว" and be disabled');

  // Morning session: Advanced 300/300 (FULL)
  await prisma.capacityStatus.upsert({
    where: {
      sessionTime_examDate: {
        sessionTime: 'MORNING',
        examDate,
      },
    },
    update: {
      totalCount: 300,
      freeCount: 0,
      advancedCount: 300,
      availabilityStatus: 'FULL',
      lastUpdated: new Date(),
    },
    create: {
      sessionTime: 'MORNING',
      examDate,
      totalCount: 300,
      freeCount: 0,
      advancedCount: 300,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: 'FULL',
      lastUpdated: new Date(),
    },
  });

  // Afternoon session: Advanced 300/300 (FULL)
  await prisma.capacityStatus.upsert({
    where: {
      sessionTime_examDate: {
        sessionTime: 'AFTERNOON',
        examDate,
      },
    },
    update: {
      totalCount: 300,
      freeCount: 0,
      advancedCount: 300,
      availabilityStatus: 'FULL',
      lastUpdated: new Date(),
    },
    create: {
      sessionTime: 'AFTERNOON',
      examDate,
      totalCount: 300,
      freeCount: 0,
      advancedCount: 300,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: 'FULL',
      lastUpdated: new Date(),
    },
  });

  // Display status
  const capacities = await prisma.capacityStatus.findMany({
    where: { examDate },
    orderBy: { sessionTime: 'asc' },
  });

  console.log('\n📊 Current Status:');
  capacities.forEach(capacity => {
    const canRegisterFree = capacity.freeCount < 150 && capacity.totalCount < 300;
    const canRegisterAdvanced = capacity.totalCount < 300;

    console.log(`   ${capacity.sessionTime}:`);
    console.log(`     Total: ${capacity.totalCount}/300`);
    console.log(`     Free: ${capacity.freeCount}/150 (${canRegisterFree ? '✅ Available' : '❌ Blocked'})`);
    console.log(`     Advanced: ${capacity.advancedCount}/300 (${canRegisterAdvanced ? '✅ Available' : '❌ Blocked'})`);
    console.log(`     Status: ${capacity.availabilityStatus}`);
    console.log('');
  });

  console.log('✅ Both sessions set to FULL');
  console.log('🔍 Expected UI behavior:');
  console.log('   - Sessions should show "เต็มแล้ว"');
  console.log('   - Sessions should be disabled (gray/transparent)');
  console.log('   - Advanced Package might show unavailable');

  await prisma.$disconnect();
}

testFullSessions().catch(console.error);