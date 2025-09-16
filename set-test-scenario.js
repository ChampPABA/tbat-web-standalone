import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setTestScenario() {
  const examDate = new Date('2025-09-27T00:00:00.000Z');

  console.log('🧪 Testing Scenario: Free 20, Advanced 150 (Total 170/300)');
  console.log('Expected: Both Free and Advanced should be available');

  await prisma.capacityStatus.upsert({
    where: {
      sessionTime_examDate: {
        sessionTime: 'MORNING',
        examDate,
      },
    },
    update: {
      totalCount: 170,
      freeCount: 20,
      advancedCount: 150,
      availabilityStatus: 'AVAILABLE',
      lastUpdated: new Date(),
    },
    create: {
      sessionTime: 'MORNING',
      examDate,
      totalCount: 170,
      freeCount: 20,
      advancedCount: 150,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: 'AVAILABLE',
      lastUpdated: new Date(),
    },
  });

  await prisma.capacityStatus.upsert({
    where: {
      sessionTime_examDate: {
        sessionTime: 'AFTERNOON',
        examDate,
      },
    },
    update: {
      totalCount: 170,
      freeCount: 20,
      advancedCount: 150,
      availabilityStatus: 'AVAILABLE',
      lastUpdated: new Date(),
    },
    create: {
      sessionTime: 'AFTERNOON',
      examDate,
      totalCount: 170,
      freeCount: 20,
      advancedCount: 150,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: 'AVAILABLE',
      lastUpdated: new Date(),
    },
  });

  // Display current status
  const capacities = await prisma.capacityStatus.findMany({
    where: { examDate },
    orderBy: { sessionTime: 'asc' },
  });

  console.log('\n📊 Current Capacity Status:');
  capacities.forEach(capacity => {
    const canRegisterFree = capacity.freeCount < 150 && capacity.totalCount < 300;
    const canRegisterAdvanced = capacity.totalCount < 300;

    console.log(`   ${capacity.sessionTime}:`);
    console.log(`     Total: ${capacity.totalCount}/300`);
    console.log(`     Free: ${capacity.freeCount}/150 (${canRegisterFree ? '✅ Available' : '❌ Blocked'})`);
    console.log(`     Advanced: ${capacity.advancedCount}/150 (${canRegisterAdvanced ? '✅ Available' : '❌ Blocked'})`);
    console.log(`     Status: ${capacity.availabilityStatus}`);
    console.log('');
  });

  console.log('✅ Test scenario set successfully!');
  console.log('📝 Now test in UI: Both Free and Advanced should be available');
  console.log('🎯 Key Test: Try registering Advanced package - should work!');

  await prisma.$disconnect();
}

setTestScenario().catch(console.error);