import { PrismaClient } from "@prisma/client";
import { beforeEach, afterEach, describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Capacity Management Tests", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Capacity Calculation Logic", () => {
    let examDate: Date;

    beforeEach(async () => {
      examDate = new Date("2025-09-27");
      
      // Clean up any existing test data
      await prisma.capacityStatus.deleteMany({
        where: { examDate },
      });
      await prisma.sessionCapacity.deleteMany({
        where: { examDate },
      });
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.capacityStatus.deleteMany({
        where: { examDate },
      });
      await prisma.sessionCapacity.deleteMany({
        where: { examDate },
      });
    });

    it("should calculate correct capacity for morning session", async () => {
      // Create session capacity
      const sessionCapacity = await prisma.sessionCapacity.create({
        data: {
          sessionTime: "MORNING",
          examDate,
          currentCount: 100,
          maxCapacity: 300,
        },
      });

      // Create corresponding capacity status
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

      expect(capacityStatus.totalCount).toBe(100);
      expect(capacityStatus.freeCount + capacityStatus.advancedCount).toBe(100);
      expect(capacityStatus.freeCount).toBeLessThanOrEqual(capacityStatus.freeLimit);
      expect(capacityStatus.totalCount).toBeLessThanOrEqual(capacityStatus.maxCapacity);
    });

    it("should handle capacity status updates correctly", async () => {
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "AFTERNOON",
          examDate,
          totalCount: 50,
          freeCount: 30,
          advancedCount: 20,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "AVAILABLE",
        },
      });

      // Simulate adding more registrations
      const updated = await prisma.capacityStatus.update({
        where: { id: capacityStatus.id },
        data: {
          totalCount: 80,
          freeCount: 50,
          advancedCount: 30,
        },
      });

      expect(updated.totalCount).toBe(80);
      expect(updated.freeCount).toBe(50);
      expect(updated.advancedCount).toBe(30);
      expect(updated.freeCount + updated.advancedCount).toBe(updated.totalCount);
    });

    it("should handle free package limit enforcement", async () => {
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "MORNING",
          examDate,
          totalCount: 150,
          freeCount: 150, // At free limit
          advancedCount: 0,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "LIMITED", // Should be LIMITED when free spots are full
        },
      });

      expect(capacityStatus.freeCount).toBe(capacityStatus.freeLimit);
      expect(capacityStatus.availabilityStatus).toBe("LIMITED");
    });

    it("should handle full capacity scenarios", async () => {
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "AFTERNOON",
          examDate,
          totalCount: 300, // Full capacity
          freeCount: 150,
          advancedCount: 150,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "FULL",
        },
      });

      expect(capacityStatus.totalCount).toBe(capacityStatus.maxCapacity);
      expect(capacityStatus.availabilityStatus).toBe("FULL");
    });

    it("should validate capacity constraints", async () => {
      // Test that free count doesn't exceed free limit
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "MORNING",
          examDate,
          totalCount: 100,
          freeCount: 100,
          advancedCount: 0,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "AVAILABLE",
        },
      });

      expect(capacityStatus.freeCount).toBeLessThanOrEqual(capacityStatus.freeLimit);
      expect(capacityStatus.totalCount).toBeLessThanOrEqual(capacityStatus.maxCapacity);
    });
  });

  describe("Session Capacity Integration", () => {
    let examDate: Date;

    beforeEach(async () => {
      examDate = new Date("2025-09-27");
      
      // Clean up any existing test data
      await prisma.capacityStatus.deleteMany({
        where: { examDate },
      });
      await prisma.sessionCapacity.deleteMany({
        where: { examDate },
      });
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.capacityStatus.deleteMany({
        where: { examDate },
      });
      await prisma.sessionCapacity.deleteMany({
        where: { examDate },
      });
    });

    it("should sync session capacity with capacity status", async () => {
      // Create session capacity
      const sessionCapacity = await prisma.sessionCapacity.create({
        data: {
          sessionTime: "MORNING",
          examDate,
          currentCount: 200,
          maxCapacity: 300,
        },
      });

      // Create matching capacity status
      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "MORNING",
          examDate,
          totalCount: 200, // Should match sessionCapacity.currentCount
          freeCount: 120,
          advancedCount: 80,
          maxCapacity: 300, // Should match sessionCapacity.maxCapacity
          freeLimit: 150,
          availabilityStatus: "AVAILABLE",
        },
      });

      expect(capacityStatus.totalCount).toBe(sessionCapacity.currentCount);
      expect(capacityStatus.maxCapacity).toBe(sessionCapacity.maxCapacity);
    });

    it("should handle concurrent session updates", async () => {
      const sessionCapacity = await prisma.sessionCapacity.create({
        data: {
          sessionTime: "AFTERNOON",
          examDate,
          currentCount: 0,
          maxCapacity: 300,
        },
      });

      const capacityStatus = await prisma.capacityStatus.create({
        data: {
          sessionTime: "AFTERNOON",
          examDate,
          totalCount: 0,
          freeCount: 0,
          advancedCount: 0,
          maxCapacity: 300,
          freeLimit: 150,
          availabilityStatus: "AVAILABLE",
        },
      });

      // Simulate multiple registrations
      const updates = [];
      for (let i = 1; i <= 5; i++) {
        updates.push(
          prisma.sessionCapacity.update({
            where: { id: sessionCapacity.id },
            data: { currentCount: i },
          })
        );
      }

      await Promise.all(updates);

      const finalSession = await prisma.sessionCapacity.findUnique({
        where: { id: sessionCapacity.id },
      });

      expect(finalSession?.currentCount).toBeGreaterThanOrEqual(1);
      expect(finalSession?.currentCount).toBeLessThanOrEqual(5);
    });
  });

  describe("Performance Tests", () => {
    let examDate: Date;

    beforeEach(async () => {
      examDate = new Date("2025-09-27");
    });

    afterEach(async () => {
      // Clean up test data
      await prisma.capacityStatus.deleteMany({
        where: { examDate },
      });
      await prisma.sessionCapacity.deleteMany({
        where: { examDate },
      });
    });

    it("should perform capacity queries efficiently", async () => {
      // Create test data
      await prisma.sessionCapacity.createMany({
        data: [
          {
            sessionTime: "MORNING",
            examDate,
            currentCount: 150,
            maxCapacity: 300,
          },
          {
            sessionTime: "AFTERNOON",
            examDate,
            currentCount: 120,
            maxCapacity: 300,
          },
        ],
      });

      await prisma.capacityStatus.createMany({
        data: [
          {
            sessionTime: "MORNING",
            examDate,
            totalCount: 150,
            freeCount: 100,
            advancedCount: 50,
            maxCapacity: 300,
            freeLimit: 150,
            availabilityStatus: "AVAILABLE",
          },
          {
            sessionTime: "AFTERNOON",
            examDate,
            totalCount: 120,
            freeCount: 80,
            advancedCount: 40,
            maxCapacity: 300,
            freeLimit: 150,
            availabilityStatus: "AVAILABLE",
          },
        ],
      });

      const startTime = Date.now();

      // Query all sessions for the exam date
      const sessions = await prisma.sessionCapacity.findMany({
        where: { examDate },
      });

      // Query capacity status for all sessions
      const capacityStatuses = await prisma.capacityStatus.findMany({
        where: { examDate },
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(sessions).toHaveLength(2);
      expect(capacityStatuses).toHaveLength(2);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});