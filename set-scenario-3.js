import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setScenario3() {
  const examDate = new Date('2025-09-27T00:00:00.000Z');

  // Scenario 3: FREE package at 150 (limit reached), Advanced still available
  console.log('Setting Scenario 3: FREE at 150/150 (blocked), Advanced available');

  await prisma.capacityStatus.upsert({
    where: {
      sessionTime_examDate: {
        sessionTime: 'MORNING',
        examDate,
      },
    },
    update: {
      totalCount: 200,
      freeCount: 150,
      advancedCount: 50,
      availabilityStatus: 'LIMITED',
      lastUpdated: new Date(),
    },
    create: {
      sessionTime: 'MORNING',
      examDate,
      totalCount: 200,
      freeCount: 150,
      advancedCount: 50,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: 'LIMITED',
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
      totalCount: 195,
      freeCount: 150,
      advancedCount: 45,
      availabilityStatus: 'LIMITED',
      lastUpdated: new Date(),
    },
    create: {
      sessionTime: 'AFTERNOON',
      examDate,
      totalCount: 195,
      freeCount: 150,
      advancedCount: 45,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: 'LIMITED',
      lastUpdated: new Date(),
    },
  });

  console.log('✅ Scenario 3 set successfully');
  console.log('FREE registrations: BLOCKED (150/150)');
  console.log('Advanced registrations: AVAILABLE');

  await prisma.$disconnect();
}

setScenario3().catch(console.error);