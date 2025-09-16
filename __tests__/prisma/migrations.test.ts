import { PrismaClient } from "@prisma/client";
import { beforeEach, afterEach, describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Database Migration and Schema Tests", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Schema Integrity", () => {
    it("should have all required models available", async () => {
      // Test that we can access all newly added models
      expect(prisma.package).toBeDefined();
      expect(prisma.userPackage).toBeDefined();
      expect(prisma.capacityStatus).toBeDefined();
      expect(prisma.sessionCapacity).toBeDefined();
    });

    it("should validate Package model structure", async () => {
      // Test Package model creation with all fields
      const testPackage = await prisma.package.create({
        data: {
          type: "FREE",
          price: 0,
          currency: "thb",
          features: ["test feature"],
          description: "test description",
          isActive: true,
        },
      });

      expect(testPackage).toHaveProperty("id");
      expect(testPackage).toHaveProperty("type");
      expect(testPackage).toHaveProperty("price");
      expect(testPackage).toHaveProperty("currency");
      expect(testPackage).toHaveProperty("features");
      expect(testPackage).toHaveProperty("description");
      expect(testPackage).toHaveProperty("isActive");
      expect(testPackage).toHaveProperty("createdAt");
      expect(testPackage).toHaveProperty("updatedAt");

      // Cleanup
      await prisma.package.delete({ where: { id: testPackage.id } });
    });

    it("should validate UserPackage model structure", async () => {
      // Create test user first
      const testUser = await prisma.user.create({
        data: {
          email: `test${Date.now()}@example.com`,
          thaiName: "ผู้ใช้ทดสอบ",
          packageType: "FREE",
          pdpaConsent: true,
        },
      });

      const testUserPackage = await prisma.userPackage.create({
        data: {
          userId: testUser.id,
          packageType: "FREE",
          sessionTime: "MORNING",
        },
      });

      expect(testUserPackage).toHaveProperty("id");
      expect(testUserPackage).toHaveProperty("userId");
      expect(testUserPackage).toHaveProperty("packageType");
      expect(testUserPackage).toHaveProperty("sessionTime");
      expect(testUserPackage).toHaveProperty("registeredAt");
      expect(testUserPackage).toHaveProperty("isActive");
      expect(testUserPackage).toHaveProperty("createdAt");
      expect(testUserPackage).toHaveProperty("updatedAt");

      // Cleanup
      await prisma.userPackage.delete({ where: { id: testUserPackage.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it("should validate CapacityStatus model structure", async () => {
      const testCapacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "MORNING",
          examDate: new Date("2025-09-27"),
        },
      });

      expect(testCapacityStatus).toHaveProperty("id");
      expect(testCapacityStatus).toHaveProperty("sessionTime");
      expect(testCapacityStatus).toHaveProperty("examDate");
      expect(testCapacityStatus).toHaveProperty("totalCount");
      expect(testCapacityStatus).toHaveProperty("freeCount");
      expect(testCapacityStatus).toHaveProperty("advancedCount");
      expect(testCapacityStatus).toHaveProperty("maxCapacity");
      expect(testCapacityStatus).toHaveProperty("freeLimit");
      expect(testCapacityStatus).toHaveProperty("availabilityStatus");
      expect(testCapacityStatus).toHaveProperty("lastUpdated");
      expect(testCapacityStatus).toHaveProperty("createdAt");
      expect(testCapacityStatus).toHaveProperty("updatedAt");

      // Cleanup
      await prisma.capacityStatus.delete({ where: { id: testCapacityStatus.id } });
    });
  });

  describe("Database Constraints", () => {
    it("should enforce PackageType enum constraints", async () => {
      // Valid enum values should work
      const validPackage = await prisma.package.create({
        data: {
          type: "FREE",
          price: 0,
          currency: "thb",
          features: ["test"],
          description: "test",
          isActive: true,
        },
      });

      expect(validPackage.type).toBe("FREE");

      // Cleanup
      await prisma.package.delete({ where: { id: validPackage.id } });
    });

    it("should enforce SessionTime enum constraints", async () => {
      const validSession = await prisma.sessionCapacity.create({
        data: {
          sessionTime: "MORNING",
          examDate: new Date("2025-09-27"),
        },
      });

      expect(validSession.sessionTime).toBe("MORNING");

      const validAfternoon = await prisma.sessionCapacity.create({
        data: {
          sessionTime: "AFTERNOON",
          examDate: new Date("2025-09-28"),
        },
      });

      expect(validAfternoon.sessionTime).toBe("AFTERNOON");

      // Cleanup
      await prisma.sessionCapacity.delete({ where: { id: validSession.id } });
      await prisma.sessionCapacity.delete({ where: { id: validAfternoon.id } });
    });

    it("should enforce AvailabilityStatus enum constraints", async () => {
      const statuses = ["AVAILABLE", "LIMITED", "FULL", "CLOSED"];
      
      for (const status of statuses) {
        const testStatus = await prisma.capacityStatus.create({
          data: {
            sessionTime: "MORNING",
            examDate: new Date(`2025-09-${20 + statuses.indexOf(status)}`),
            availabilityStatus: status as any,
          },
        });

        expect(testStatus.availabilityStatus).toBe(status);

        // Cleanup
        await prisma.capacityStatus.delete({ where: { id: testStatus.id } });
      }
    });

    it("should enforce foreign key constraints", async () => {
      // Create test user
      const testUser = await prisma.user.create({
        data: {
          email: `test${Date.now()}@example.com`,
          thaiName: "ผู้ใช้ทดสอบ",
          packageType: "FREE",
          pdpaConsent: true,
        },
      });

      // Valid foreign key should work
      const validUserPackage = await prisma.userPackage.create({
        data: {
          userId: testUser.id,
          packageType: "FREE",
          sessionTime: "MORNING",
        },
      });

      expect(validUserPackage.userId).toBe(testUser.id);

      // Invalid foreign key should fail
      await expect(
        prisma.userPackage.create({
          data: {
            userId: "invalid-user-id",
            packageType: "FREE",
            sessionTime: "MORNING",
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.userPackage.delete({ where: { id: validUserPackage.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });
  });

  describe("Database Indexes", () => {
    it("should efficiently query by packageType and sessionTime", async () => {
      // Create test data
      const testUsers = [];
      const testUserPackages = [];

      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            email: `perftest${i}${Date.now()}@example.com`,
            thaiName: `ผู้ใช้ทดสอบ ${i}`,
            packageType: i % 2 === 0 ? "FREE" : "ADVANCED",
            pdpaConsent: true,
          },
        });
        testUsers.push(user);

        const userPackage = await prisma.userPackage.create({
          data: {
            userId: user.id,
            packageType: i % 2 === 0 ? "FREE" : "ADVANCED",
            sessionTime: i % 2 === 0 ? "MORNING" : "AFTERNOON",
          },
        });
        testUserPackages.push(userPackage);
      }

      const startTime = Date.now();

      // Query that should use indexes
      const freePackages = await prisma.userPackage.findMany({
        where: {
          packageType: "FREE",
          sessionTime: "MORNING",
        },
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(freePackages.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(500); // Should be fast with indexes

      // Cleanup
      for (const userPackage of testUserPackages) {
        await prisma.userPackage.delete({ where: { id: userPackage.id } });
      }
      for (const user of testUsers) {
        await prisma.user.delete({ where: { id: user.id } });
      }
    });

    it("should efficiently query capacity status by session time", async () => {
      const examDate = new Date("2025-09-27");
      
      // Create test capacity status data
      const testData = [];
      for (let i = 0; i < 10; i++) {
        const capacityStatus = await prisma.capacityStatus.create({
          data: {
            sessionTime: i % 2 === 0 ? "MORNING" : "AFTERNOON",
            examDate: new Date(examDate.getTime() + i * 24 * 60 * 60 * 1000),
            totalCount: i * 10,
            freeCount: i * 5,
            advancedCount: i * 5,
          },
        });
        testData.push(capacityStatus);
      }

      const startTime = Date.now();

      // Query that should use session time index
      const morningStatuses = await prisma.capacityStatus.findMany({
        where: {
          sessionTime: "MORNING",
        },
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(morningStatuses.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(500); // Should be fast with indexes

      // Cleanup
      for (const data of testData) {
        await prisma.capacityStatus.delete({ where: { id: data.id } });
      }
    });
  });

  describe("Data Integrity", () => {
    it("should maintain referential integrity on cascading deletes", async () => {
      // Create test user with related data
      const testUser = await prisma.user.create({
        data: {
          email: `cascade${Date.now()}@example.com`,
          thaiName: "ผู้ใช้ทดสอบ Cascade",
          packageType: "ADVANCED",
          pdpaConsent: true,
        },
      });

      const userPackage = await prisma.userPackage.create({
        data: {
          userId: testUser.id,
          packageType: "ADVANCED",
          sessionTime: "MORNING",
        },
      });

      const examCode = await prisma.examCode.create({
        data: {
          userId: testUser.id,
          code: `CASCADE-${Date.now()}`,
          packageType: "ADVANCED",
          subject: "BIOLOGY",
          sessionTime: "MORNING",
        },
      });

      // Delete user should cascade to related records
      await prisma.user.delete({ where: { id: testUser.id } });

      // Verify related records are deleted
      const deletedUserPackage = await prisma.userPackage.findUnique({
        where: { id: userPackage.id },
      });
      const deletedExamCode = await prisma.examCode.findUnique({
        where: { id: examCode.id },
      });

      expect(deletedUserPackage).toBeNull();
      expect(deletedExamCode).toBeNull();
    });

    it("should validate business logic constraints", async () => {
      const examDate = new Date("2025-09-27");
      
      // Create capacity status with valid business constraints
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "MORNING",
          examDate,
          totalCount: 100,
          freeCount: 75,
          advancedCount: 25,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "AVAILABLE",
        },
      });

      // Verify business logic
      expect(capacityStatus.freeCount + capacityStatus.advancedCount).toBe(capacityStatus.totalCount);
      expect(capacityStatus.freeCount).toBeLessThanOrEqual(capacityStatus.freeLimit);
      expect(capacityStatus.totalCount).toBeLessThanOrEqual(capacityStatus.maxCapacity);

      // Cleanup
      await prisma.capacityStatus.delete({ where: { id: capacityStatus.id } });
    });
  });
});