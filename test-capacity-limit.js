/**
 * Test script to demonstrate capacity limit scenarios
 * This script modifies the database to simulate different capacity scenarios
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function demonstrateCapacityScenarios() {
  try {
    console.log('🧪 TBAT Capacity Management Demonstration');
    console.log('=========================================\n');

    // Target exam date (September 27, 2025)
    const examDate = new Date('2025-09-27T00:00:00.000Z');

    // Scenario 1: Reset to clean state
    console.log('📊 Scenario 1: Clean State (Both sessions available)');
    await setCapacityScenario('MORNING', examDate, 50, 30); // 50 free, 30 advanced
    await setCapacityScenario('AFTERNOON', examDate, 45, 25); // 45 free, 25 advanced
    await displayCapacityStatus();

    // Scenario 2: FREE package at 149 (just under limit)
    console.log('\n📊 Scenario 2: FREE package at 149 (1 slot remaining)');
    await setCapacityScenario('MORNING', examDate, 149, 50); // 149 free, 50 advanced
    await setCapacityScenario('AFTERNOON', examDate, 149, 45); // 149 free, 45 advanced
    await displayCapacityStatus();

    // Scenario 3: FREE package at 150 (limit reached - should block free registrations)
    console.log('\n📊 Scenario 3: FREE package at 150 (Free registration BLOCKED)');
    console.log('⚠️  Expected: Free registrations should be disabled, Advanced still available');
    await setCapacityScenario('MORNING', examDate, 150, 50); // 150 free, 50 advanced
    await setCapacityScenario('AFTERNOON', examDate, 150, 45); // 150 free, 45 advanced
    await displayCapacityStatus();

    // Scenario 4: Total capacity at 299 (1 slot remaining)
    console.log('\n📊 Scenario 4: Total capacity at 299 (1 slot remaining)');
    await setCapacityScenario('MORNING', examDate, 150, 149); // 150 free, 149 advanced = 299 total
    await setCapacityScenario('AFTERNOON', examDate, 150, 149); // 150 free, 149 advanced = 299 total
    await displayCapacityStatus();

    // Scenario 5: Total capacity at 300 (FULL - should block all registrations)
    console.log('\n📊 Scenario 5: Total capacity at 300 (ALL registrations BLOCKED)');
    console.log('⚠️  Expected: Both Free and Advanced registrations should be disabled');
    await setCapacityScenario('MORNING', examDate, 150, 150); // 150 free, 150 advanced = 300 total
    await setCapacityScenario('AFTERNOON', examDate, 150, 150); // 150 free, 150 advanced = 300 total
    await displayCapacityStatus();

    console.log('\n✅ Demonstration complete!');
    console.log('📝 To test in the UI:');
    console.log('   1. Go to http://localhost:3000/register');
    console.log('   2. Fill out Step 1 (personal information)');
    console.log('   3. Go to Step 2 and select FREE package');
    console.log('   4. Go to session selection - you should see disabled sessions');
    console.log('\n🔄 To reset to normal state, run this script again with scenario 1');

  } catch (error) {
    console.error('❌ Error in demonstration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function setCapacityScenario(sessionTime, examDate, freeCount, advancedCount) {
  const totalCount = freeCount + advancedCount;

  // Determine availability status based on counts
  let availabilityStatus = 'AVAILABLE';
  if (totalCount >= 300) {
    availabilityStatus = 'FULL';
  } else if (freeCount >= 150) {
    availabilityStatus = 'LIMITED'; // Free full, Advanced available
  }

  await prisma.capacityStatus.upsert({
    where: {
      sessionTime_examDate: {
        sessionTime,
        examDate,
      },
    },
    update: {
      totalCount,
      freeCount,
      advancedCount,
      availabilityStatus,
      lastUpdated: new Date(),
    },
    create: {
      sessionTime,
      examDate,
      totalCount,
      freeCount,
      advancedCount,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus,
      lastUpdated: new Date(),
    },
  });
}

async function displayCapacityStatus() {
  const examDate = new Date('2025-09-27T00:00:00.000Z');

  const capacities = await prisma.capacityStatus.findMany({
    where: { examDate },
    orderBy: { sessionTime: 'asc' },
  });

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
}

// Run the demonstration
demonstrateCapacityScenarios().catch(console.error);