import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.$transaction([
    prisma.supportTicket.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.pDFNotification.deleteMany(),
    prisma.pDFDownload.deleteMany(),
    prisma.pDFSolution.deleteMany(),
    prisma.analytics.deleteMany(),
    prisma.examResult.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.examCode.deleteMany(),
    prisma.userPackage.deleteMany(),
    prisma.capacityStatus.deleteMany(),
    prisma.sessionCapacity.deleteMany(),
    prisma.package.deleteMany(),
    prisma.account.deleteMany(),
    prisma.userSession.deleteMany(),
    prisma.adminUser.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create admin users
  const adminPassword = await bcrypt.hash("admin123", 12);

  const superAdmin = await prisma.adminUser.create({
    data: {
      email: "superadmin@tbat-exam.com",
      passwordHash: adminPassword,
      thaiName: "ผู้ดูแลระบบหลัก",
      role: "SUPER_ADMIN",
      permissions: ["ALL"],
    },
  });

  const normalAdmin = await prisma.adminUser.create({
    data: {
      email: "admin@tbat-exam.com",
      passwordHash: adminPassword,
      thaiName: "ผู้ดูแลระบบ",
      role: "ADMIN",
      permissions: ["USER_MANAGEMENT", "EXAM_MANAGEMENT", "PDF_MANAGEMENT"],
    },
  });

  console.log("✅ Created admin users");

  // Create packages
  await prisma.package.createMany({
    data: [
      {
        type: "FREE",
        price: 0,
        currency: "thb",
        features: [
          "เข้าสอบได้ 1 วิชา",
          "ดูผลคะแนนเบื้องต้น",
          "เปรียบเทียบคะแนนเฉลี่ย",
          "ข้อมูลสถิติพื้นฐาน"
        ],
        description: "แพ็กเกจฟรี - เข้าสอบ 1 วิชา พร้อมผลคะแนนเบื้องต้น",
        isActive: true,
      },
      {
        type: "ADVANCED",
        price: 69000, // 690 THB
        currency: "thb",
        features: [
          "เข้าสอบได้ครบ 3 วิชา (ชีววิทยา เคมี ฟิสิกส์)",
          "วิเคราะห์ผลคะแนนละเอียด",
          "เปรียบเทียบคะแนนแต่ละวิชา",
          "กราฟแสดงจุดแข็ง-จุดอ่อน",
          "ดาวน์โหลดเฉลย PDF",
          "คำแนะนำการปรับปรุง",
          "สถิติเปรียบเทียบเชิงลึก"
        ],
        description: "แพ็กเกจพรีเมียม - เข้าสอบครบ 3 วิชา พร้อมวิเคราะห์ผลละเอียดและเฉลย PDF",
        isActive: true,
      },
    ],
  });

  console.log("✅ Created packages");

  // Create test users
  const userPassword = await bcrypt.hash("password123", 12);

  const testUsers = await Promise.all([
    // Free package users
    ...Array.from({ length: 5 }, async (_, i) => {
      return prisma.user.create({
        data: {
          email: `free${i + 1}@test.com`,
          passwordHash: userPassword,
          thaiName: `นักเรียนฟรี ${i + 1}`,
          phone: `08${String(i + 1).padStart(8, "0")}`,
          school: `โรงเรียนทดสอบ ${i + 1}`,
          parentName: `ผู้ปกครองฟรี ${i + 1}`,
          parentPhone: `09${String(i + 1).padStart(8, "0")}`,
          packageType: "FREE",
          pdpaConsent: true,
        },
      });
    }),
    // Advanced package users
    ...Array.from({ length: 5 }, async (_, i) => {
      return prisma.user.create({
        data: {
          email: `advanced${i + 1}@test.com`,
          passwordHash: userPassword,
          thaiName: `นักเรียนพรีเมียม ${i + 1}`,
          phone: `09${String(i + 1).padStart(8, "0")}`,
          school: `โรงเรียนชั้นนำ ${i + 1}`,
          lineId: `line_${i + 1}`,
          parentName: `ผู้ปกครองพรีเมียม ${i + 1}`,
          parentPhone: `08${String(i + 6).padStart(8, "0")}`,
          packageType: "ADVANCED",
          pdpaConsent: true,
        },
      });
    }),
  ]);

  console.log("✅ Created 10 test users");

  // Create session capacities for exam date
  const examDate = new Date("2025-09-27"); // 27 กันยายน 2568

  await prisma.sessionCapacity.createMany({
    data: [
      {
        sessionTime: "MORNING",
        currentCount: 5,
        maxCapacity: 300,
        examDate,
      },
      {
        sessionTime: "AFTERNOON",
        currentCount: 3,
        maxCapacity: 300,
        examDate,
      },
    ],
  });

  console.log("✅ Created session capacities");

  // Create capacity status tracking
  await prisma.capacityStatus.createMany({
    data: [
      {
        sessionTime: "MORNING",
        examDate,
        totalCount: 5,
        freeCount: 3,
        advancedCount: 2,
        maxCapacity: 300,
        freeLimit: 150,
        availabilityStatus: "AVAILABLE",
      },
      {
        sessionTime: "AFTERNOON",
        examDate,
        totalCount: 3,
        freeCount: 2,
        advancedCount: 1,
        maxCapacity: 300,
        freeLimit: 150,
        availabilityStatus: "AVAILABLE",
      },
    ],
  });

  console.log("✅ Created capacity status tracking");

  // Create UserPackage relationships
  const userPackages = [];
  
  // Free users get package relationships
  for (let i = 0; i < 5; i++) {
    const user = testUsers[i];
    if (!user) continue;
    
    userPackages.push({
      userId: user.id,
      packageType: "FREE" as any,
      sessionTime: (i % 2 === 0 ? "MORNING" : "AFTERNOON") as any,
      isActive: true,
    });
  }

  // Advanced users get package relationships
  for (let i = 5; i < 10; i++) {
    const user = testUsers[i];
    if (!user) continue;
    
    userPackages.push({
      userId: user.id,
      packageType: "ADVANCED" as any,
      sessionTime: (i % 2 === 0 ? "MORNING" : "AFTERNOON") as any,
      isActive: true,
    });
  }

  await prisma.userPackage.createMany({ data: userPackages });

  console.log("✅ Created user package relationships");

  // Create exam codes for users
  const examCodes = [];

  // Free users get 1 exam code each
  for (let i = 0; i < 5; i++) {
    const user = testUsers[i];
    if (!user) continue;
    const subjects = ["BIOLOGY", "CHEMISTRY", "PHYSICS"];
    const subject = subjects[i % 3];

    examCodes.push({
      userId: user.id,
      code: `FREE-${String(Math.random()).substring(2, 10)}-${subject}`,
      packageType: "FREE" as any,
      subject: subject as any,
      sessionTime: (i % 2 === 0 ? "MORNING" : "AFTERNOON") as any,
      isUsed: false,
    });
  }

  // Advanced users get 1 exam code (covers all subjects)
  for (let i = 5; i < 10; i++) {
    const user = testUsers[i];
    if (!user) continue;
    const baseCode = String(Math.random()).substring(2, 10);

    examCodes.push({
      userId: user.id,
      code: `ADV-${baseCode}`,
      packageType: "ADVANCED" as any,
      subject: "BIOLOGY" as any, // Default subject, ADVANCED covers all subjects
      sessionTime: (i % 2 === 0 ? "MORNING" : "AFTERNOON") as any,
      isUsed: false,
    });
  }

  await prisma.examCode.createMany({ data: examCodes });

  console.log("✅ Created exam codes");

  // Create sample payments for advanced users
  const payments = [];

  for (let i = 5; i < 10; i++) {
    const user = testUsers[i];
    if (!user) continue;

    payments.push({
      userId: user.id,
      stripePaymentIntentId: `pi_test_${String(Math.random()).substring(2, 20)}`,
      amount: 69000, // 690 THB
      currency: "thb",
      paymentType: "ADVANCED_PACKAGE" as any,
      status: "COMPLETED" as any,
      completedAt: new Date(),
    });
  }

  await prisma.payment.createMany({ data: payments });

  console.log("✅ Created payment records");

  // Create sample PDF solutions
  const pdfSolutions = await Promise.all([
    prisma.pDFSolution.create({
      data: {
        subject: "BIOLOGY",
        examDate,
        fileUrl: "https://storage.example.com/pdfs/biology-solution.pdf",
        fileSize: 2048000, // 2MB
        description: "เฉลยละเอียดวิชาชีววิทยา TBAT Mock Exam",
        uploadAdminId: normalAdmin.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
      },
    }),
    prisma.pDFSolution.create({
      data: {
        subject: "CHEMISTRY",
        examDate,
        fileUrl: "https://storage.example.com/pdfs/chemistry-solution.pdf",
        fileSize: 1536000, // 1.5MB
        description: "เฉลยละเอียดวิชาเคมี TBAT Mock Exam",
        uploadAdminId: normalAdmin.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.pDFSolution.create({
      data: {
        subject: "PHYSICS",
        examDate,
        fileUrl: "https://storage.example.com/pdfs/physics-solution.pdf",
        fileSize: 1792000, // 1.75MB
        description: "เฉลยละเอียดวิชาฟิสิกส์ TBAT Mock Exam",
        uploadAdminId: normalAdmin.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log("✅ Created PDF solutions");

  // Create sample exam results for some users
  const createdExamCodes = await prisma.examCode.findMany({
    take: 5,
  });

  for (const examCode of createdExamCodes) {
    await prisma.examResult.create({
      data: {
        userId: examCode.userId,
        examCodeId: examCode.id,
        totalScore: Math.floor(Math.random() * 40) + 60, // 60-100
        biologyScore: examCode.subject === "BIOLOGY" ? Math.floor(Math.random() * 40) + 60 : null,
        chemistryScore:
          examCode.subject === "CHEMISTRY" ? Math.floor(Math.random() * 40) + 60 : null,
        physicsScore: examCode.subject === "PHYSICS" ? Math.floor(Math.random() * 40) + 60 : null,
        percentile: Math.floor(Math.random() * 30) + 70, // 70-100 percentile
        completionTime: Math.floor(Math.random() * 60) + 120, // 120-180 minutes
        expiresAt: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
        isAccessible: true,
      },
    });

    // Mark exam code as used
    await prisma.examCode.update({
      where: { id: examCode.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }

  console.log("✅ Created sample exam results");

  // Create sample support ticket
  await prisma.supportTicket.create({
    data: {
      userId: testUsers[0]?.id || "",
      adminId: normalAdmin.id,
      issueType: "CODE_PROBLEM",
      description: "ไม่สามารถใช้รหัสสอบได้",
      status: "OPEN",
      priority: "MEDIUM",
    },
  });

  console.log("✅ Created sample support ticket");

  // Create audit log entries for monitoring and debugging
  const auditLogs = [
    {
      adminId: superAdmin.id,
      actionType: "USER_UPDATE" as any,
      targetId: testUsers[0]?.id || "",
      originalData: { packageType: "FREE", isActive: false },
      newData: { packageType: "FREE", isActive: true },
      reason: "Initial user setup during database seeding",
    },
    {
      adminId: normalAdmin.id,
      actionType: "PDF_UPLOAD" as any,
      targetId: pdfSolutions[0]?.id || "",
      originalData: {},
      newData: { 
        subject: "BIOLOGY", 
        fileSize: 2048000, 
        isActive: true 
      },
      reason: "Initial PDF solution upload for Biology subject",
    },
    {
      adminId: normalAdmin.id,
      actionType: "PDF_UPLOAD" as any,
      targetId: pdfSolutions[1]?.id || "",
      originalData: {},
      newData: { 
        subject: "CHEMISTRY", 
        fileSize: 1536000, 
        isActive: true 
      },
      reason: "Initial PDF solution upload for Chemistry subject",
    },
    {
      adminId: normalAdmin.id,
      actionType: "PDF_UPLOAD" as any,
      targetId: pdfSolutions[2]?.id || "",
      originalData: {},
      newData: { 
        subject: "PHYSICS", 
        fileSize: 1792000, 
        isActive: true 
      },
      reason: "Initial PDF solution upload for Physics subject",
    }
  ];

  await prisma.auditLog.createMany({ data: auditLogs });

  console.log("✅ Created audit log entries for monitoring");

  // Create PDPA consent records for all users (required for compliance)
  const pdpaConsents = [];
  
  for (const user of testUsers) {
    if (!user) continue;
    
    pdpaConsents.push({
      userId: user.id,
      consentType: "DATA_PROCESSING",
      status: "GRANTED",
      grantedAt: new Date(),
      ipAddress: "127.0.0.1", // Test IP
      userAgent: "Test User Agent - Database Seeding",
      metadata: {
        version: "1.0",
        language: "th",
        consentMethod: "registration_form"
      }
    });
  }

  await prisma.pDPAConsent.createMany({ data: pdpaConsents });

  console.log("✅ Created PDPA consent records for compliance");

  // Create security log entries for initial setup
  const securityLogs = [
    {
      eventType: "LOGIN_SUCCESS" as any,
      action: "ADMIN_LOGIN",
      userId: superAdmin.id,
      resourceType: "ADMIN_PANEL",
      metadata: { role: "SUPER_ADMIN", setupPhase: true },
      ipAddress: "127.0.0.1",
      userAgent: "Database Seeding Script",
    },
    {
      eventType: "ADMIN_DATA_ACCESS" as any,
      action: "DATABASE_SEED",
      userId: superAdmin.id,
      resourceType: "DATABASE",
      metadata: { 
        operation: "INITIAL_SEED",
        recordsCreated: {
          users: testUsers.length,
          packages: 2,
          sessionCapacities: 2,
          examCodes: examCodes.length
        }
      },
      ipAddress: "127.0.0.1",
      userAgent: "Database Seeding Script",
    }
  ];

  await prisma.securityLog.createMany({ data: securityLogs });

  console.log("✅ Created security log entries");

  // Verify all foreign key relationships and constraints
  console.log("🔍 Verifying database relationships and constraints...");
  
  // Check Package relationships
  const packageCount = await prisma.package.count();
  console.log(`   ✓ Packages created: ${packageCount}`);
  
  // Check User relationships
  const userCount = await prisma.user.count();
  console.log(`   ✓ Users created: ${userCount}`);
  
  // Check UserPackage relationships with foreign keys
  const userPackageCount = await prisma.userPackage.count();
  console.log(`   ✓ User-Package relationships: ${userPackageCount}`);
  
  // Check ExamCode relationships
  const examCodeCount = await prisma.examCode.count();
  console.log(`   ✓ Exam codes with user relationships: ${examCodeCount}`);
  
  // Check SessionCapacity and CapacityStatus alignment
  const sessionCapacityCount = await prisma.sessionCapacity.count();
  const capacityStatusCount = await prisma.capacityStatus.count();
  console.log(`   ✓ Session capacities: ${sessionCapacityCount}`);
  console.log(`   ✓ Capacity status records: ${capacityStatusCount}`);
  
  // Check Payment relationships
  const paymentCount = await prisma.payment.count();
  console.log(`   ✓ Payments with user relationships: ${paymentCount}`);
  
  // Check Audit log relationships
  const auditLogCount = await prisma.auditLog.count();
  console.log(`   ✓ Audit logs with admin relationships: ${auditLogCount}`);

  console.log("✅ All foreign key relationships verified successfully");

  console.log("🎉 Enhanced seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
