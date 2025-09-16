import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabaseQueries() {
  console.log("🔍 Testing Database Queries...\n");

  try {
    // Test 1: Count records
    console.log("📊 Record Counts:");
    const userCount = await prisma.user.count();
    const adminCount = await prisma.adminUser.count();
    const examCodeCount = await prisma.examCode.count();
    const paymentCount = await prisma.payment.count();

    console.log(`  - Users: ${userCount}`);
    console.log(`  - Admins: ${adminCount}`);
    console.log(`  - Exam Codes: ${examCodeCount}`);
    console.log(`  - Payments: ${paymentCount}\n`);

    // Test 2: Query users with relations
    console.log("👥 Testing User Queries:");
    const freeUser = await prisma.user.findFirst({
      where: { packageType: "FREE" },
      include: {
        examCodes: true,
        payments: true,
      },
    });
    console.log(`  - Free User: ${freeUser?.email}`);
    console.log(`    Exam Codes: ${freeUser?.examCodes.length}`);
    console.log(`    Payments: ${freeUser?.payments.length}\n`);

    const advancedUser = await prisma.user.findFirst({
      where: { packageType: "ADVANCED" },
      include: {
        examCodes: true,
        payments: true,
      },
    });
    console.log(`  - Advanced User: ${advancedUser?.email}`);
    console.log(`    Exam Codes: ${advancedUser?.examCodes.length}`);
    console.log(`    Payments: ${advancedUser?.payments.length}\n`);

    // Test 3: Session capacity
    console.log("🕐 Testing Session Capacity:");
    const sessions = await prisma.sessionCapacity.findMany();
    sessions.forEach((session) => {
      console.log(`  - ${session.sessionTime}: ${session.currentCount}/${session.maxCapacity}`);
    });
    console.log();

    // Test 4: PDF Solutions
    console.log("📄 Testing PDF Solutions:");
    const pdfs = await prisma.pDFSolution.findMany();
    pdfs.forEach((pdf) => {
      console.log(`  - ${pdf.subject}: ${pdf.fileUrl}`);
    });
    console.log();

    // Test 5: Exam Results
    console.log("📈 Testing Exam Results:");
    const results = await prisma.examResult.findMany({
      take: 3,
      include: {
        user: true,
        examCode: true,
      },
    });
    results.forEach((result) => {
      console.log(`  - User: ${result.user.email}, Score: ${result.totalScore}`);
    });
    console.log();

    // Test 6: Transaction test
    console.log("💱 Testing Transaction:");
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: "transaction-test@example.com",
          passwordHash: "hashed",
          thaiName: "ทดสอบธุรกรรม",
          phone: "0999999999",
          school: "โรงเรียนทดสอบ",
          pdpaConsent: true,
        },
      });

      const examCode = await tx.examCode.create({
        data: {
          userId: user.id,
          code: `TEST-${Date.now()}`,
          packageType: "FREE",
          subject: "BIOLOGY",
          sessionTime: "MORNING",
        },
      });

      return { user, examCode };
    });
    console.log(`  ✅ Created user: ${newUser.user.email}`);
    console.log(`  ✅ Created exam code: ${newUser.examCode.code}\n`);

    // Cleanup
    await prisma.examCode.delete({ where: { id: newUser.examCode.id } });
    await prisma.user.delete({ where: { id: newUser.user.id } });
    console.log("  🧹 Cleaned up test data\n");

    console.log("✅ All database queries working correctly!");
  } catch (error) {
    console.error("❌ Database query error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseQueries();
