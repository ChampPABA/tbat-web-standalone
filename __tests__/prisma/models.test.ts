import { PrismaClient } from "@prisma/client";
import { beforeEach, afterEach, describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Prisma Database Models", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Package Model", () => {
    it("should create FREE package with correct pricing", async () => {
      const freePackage = await prisma.package.create({
        data: {
          type: "FREE",
          price: 0,
          currency: "thb",
          features: ["เข้าสอบได้ 1 วิชา", "ดูผลคะแนนเบื้องต้น"],
          description: "แพ็กเกจฟรี",
          isActive: true,
        },
      });

      expect(freePackage.type).toBe("FREE");
      expect(freePackage.price).toBe(0);
      expect(freePackage.currency).toBe("thb");
      expect(freePackage.features).toHaveLength(2);
      expect(freePackage.isActive).toBe(true);

      // Cleanup
      await prisma.package.delete({ where: { id: freePackage.id } });
    });

    it("should create ADVANCED package with correct pricing", async () => {
      const advancedPackage = await prisma.package.create({
        data: {
          type: "ADVANCED",
          price: 69000, // 690 THB
          currency: "thb",
          features: [
            "เข้าสอบได้ครบ 3 วิชา",
            "วิเคราะห์ผลคะแนนละเอียด",
            "ดาวน์โหลดเฉลย PDF",
          ],
          description: "แพ็กเกจพรีเมียม",
          isActive: true,
        },
      });

      expect(advancedPackage.type).toBe("ADVANCED");
      expect(advancedPackage.price).toBe(69000);
      expect(advancedPackage.features).toHaveLength(3);

      // Cleanup
      await prisma.package.delete({ where: { id: advancedPackage.id } });
    });

    it("should enforce unique constraint on package type", async () => {
      // Create first package
      const firstPackage = await prisma.package.create({
        data: {
          type: "FREE",
          price: 0,
          currency: "thb",
          features: ["test"],
          description: "test",
          isActive: true,
        },
      });

      // Attempt to create duplicate type should fail
      await expect(
        prisma.package.create({
          data: {
            type: "FREE",
            price: 0,
            currency: "thb",
            features: ["test2"],
            description: "test2",
            isActive: true,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.package.delete({ where: { id: firstPackage.id } });
    });
  });

  describe("SessionCapacity Model", () => {
    it("should create session capacity with correct defaults", async () => {
      const examDate = new Date("2025-09-27");
      
      const sessionCapacity = await prisma.sessionCapacity.create({
        data: {
          sessionTime: "MORNING",
          examDate,
        },
      });

      expect(sessionCapacity.sessionTime).toBe("MORNING");
      expect(sessionCapacity.currentCount).toBe(0);
      expect(sessionCapacity.maxCapacity).toBe(300);
      expect(sessionCapacity.examDate.toISOString()).toBe(examDate.toISOString());

      // Cleanup
      await prisma.sessionCapacity.delete({ where: { id: sessionCapacity.id } });
    });

    it("should enforce unique constraint on sessionTime and examDate", async () => {
      const examDate = new Date("2025-09-27");
      
      // Create first session
      const firstSession = await prisma.sessionCapacity.create({
        data: {
          sessionTime: "MORNING",
          examDate,
        },
      });

      // Attempt to create duplicate should fail
      await expect(
        prisma.sessionCapacity.create({
          data: {
            sessionTime: "MORNING",
            examDate,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.sessionCapacity.delete({ where: { id: firstSession.id } });
    });
  });

  describe("CapacityStatus Model", () => {
    it("should create capacity status with proper defaults", async () => {
      const examDate = new Date("2025-09-27");
      
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "AFTERNOON",
          examDate,
        },
      });

      expect(capacityStatus.sessionTime).toBe("AFTERNOON");
      expect(capacityStatus.totalCount).toBe(0);
      expect(capacityStatus.freeCount).toBe(0);
      expect(capacityStatus.advancedCount).toBe(0);
      expect(capacityStatus.maxCapacity).toBe(300);
      expect(capacityStatus.freeLimit).toBe(150);
      expect(capacityStatus.availabilityStatus).toBe("AVAILABLE");

      // Cleanup
      await prisma.capacityStatus.delete({ where: { id: capacityStatus.id } });
    });

    it("should update lastUpdated when modified", async () => {
      const examDate = new Date("2025-09-27");
      
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "MORNING",
          examDate,
          totalCount: 10,
        },
      });

      const originalUpdated = capacityStatus.lastUpdated;

      // Wait a moment and update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await prisma.capacityStatus.update({
        where: { id: capacityStatus.id },
        data: { totalCount: 15 },
      });

      expect(updated.lastUpdated.getTime()).toBeGreaterThan(originalUpdated.getTime());

      // Cleanup
      await prisma.capacityStatus.delete({ where: { id: capacityStatus.id } });
    });
  });

  describe("UserPackage Model", () => {
    let testUser: any;

    beforeEach(async () => {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          email: `test${Date.now()}@example.com`,
          thaiName: "ผู้ใช้ทดสอบ",
          packageType: "FREE",
          pdpaConsent: true,
        },
      });
    });

    afterEach(async () => {
      // Cleanup user and related data
      if (testUser) {
        await prisma.userPackage.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
      }
    });

    it("should create user package relationship", async () => {
      const userPackage = await prisma.userPackage.create({
        data: {
          userId: testUser.id,
          packageType: "FREE",
          sessionTime: "MORNING",
        },
      });

      expect(userPackage.userId).toBe(testUser.id);
      expect(userPackage.packageType).toBe("FREE");
      expect(userPackage.sessionTime).toBe("MORNING");
      expect(userPackage.isActive).toBe(true);
    });

    it("should enforce unique constraint on userId, packageType, sessionTime", async () => {
      // Create first relationship
      await prisma.userPackage.create({
        data: {
          userId: testUser.id,
          packageType: "FREE",
          sessionTime: "MORNING",
        },
      });

      // Attempt to create duplicate should fail
      await expect(
        prisma.userPackage.create({
          data: {
            userId: testUser.id,
            packageType: "FREE",
            sessionTime: "MORNING",
          },
        })
      ).rejects.toThrow();
    });

    it("should cascade delete when user is deleted", async () => {
      const userPackage = await prisma.userPackage.create({
        data: {
          userId: testUser.id,
          packageType: "ADVANCED",
          sessionTime: "AFTERNOON",
        },
      });

      // Delete user should cascade delete userPackage
      await prisma.user.delete({ where: { id: testUser.id } });

      const deletedUserPackage = await prisma.userPackage.findUnique({
        where: { id: userPackage.id },
      });

      expect(deletedUserPackage).toBeNull();
      
      // Set testUser to null to prevent cleanup
      testUser = null;
    });
  });

  describe("Database Relationships", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `test${Date.now()}@example.com`,
          thaiName: "ผู้ใช้ทดสอบ",
          packageType: "ADVANCED",
          pdpaConsent: true,
        },
      });
    });

    afterEach(async () => {
      if (testUser) {
        await prisma.userPackage.deleteMany({ where: { userId: testUser.id } });
        await prisma.examCode.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
      }
    });

    it("should maintain foreign key relationships", async () => {
      // Create user package
      const userPackage = await prisma.userPackage.create({
        data: {
          userId: testUser.id,
          packageType: "ADVANCED",
          sessionTime: "MORNING",
        },
        include: {
          user: true,
        },
      });

      expect(userPackage.user.id).toBe(testUser.id);
      expect(userPackage.user.thaiName).toBe("ผู้ใช้ทดสอบ");
    });

    it("should validate exam code creation with package type consistency", async () => {
      const examCode = await prisma.examCode.create({
        data: {
          userId: testUser.id,
          code: `TEST-${Date.now()}`,
          packageType: "ADVANCED",
          subject: "BIOLOGY",
          sessionTime: "MORNING",
        },
      });

      expect(examCode.packageType).toBe("ADVANCED");
      expect(examCode.userId).toBe(testUser.id);
    });
  });
});