import { CAPACITY_CONSTRAINTS } from "../types/capacity";

// Mock the centralized prisma instance
const mockPrismaCapacityStatus = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

jest.mock("../lib/prisma", () => ({
  prisma: {
    capacityStatus: mockPrismaCapacityStatus,
    $transaction: jest.fn(),
  },
  getPrisma: jest.fn(),
}));

import {
  calculateCapacityStatus,
  getCapacityStatusForUI,
  checkRegistrationEligibility,
  updateCapacityOnRegistration,
} from "../lib/capacity-management";

// Mock monitoring
jest.mock("../lib/monitoring", () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  },
}));

// Get reference to mocked prisma - import after the mock is defined
import { prisma as mockPrisma } from "../lib/prisma";

describe("Capacity Management Integration - Story 3.1", () => {
  const mockExamDate = new Date("2025-09-27");
  const mockCapacityData = {
    id: "test-id",
    sessionTime: "MORNING",
    examDate: mockExamDate,
    totalCount: 100,
    freeCount: 50,
    advancedCount: 50,
    maxCapacity: 300,
    freeLimit: 150,
    availabilityStatus: "AVAILABLE",
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock for create method
    mockPrismaCapacityStatus.create.mockResolvedValue({
      id: "new-capacity-id",
      sessionTime: "MORNING",
      examDate: mockExamDate,
      totalCount: 0,
      freeCount: 0,
      advancedCount: 0,
      maxCapacity: 300,
      freeLimit: 150,
      availabilityStatus: "AVAILABLE",
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("Story 3.1 Algorithm Implementation", () => {
    it("should enforce 300 total capacity limit", async () => {
      // Mock full capacity scenario with valid capacityData that has id
      const fullCapacityData = {
        ...mockCapacityData,
        totalCount: 300,
        freeCount: 150,
        advancedCount: 150,
      };

      console.log("Full capacity data:", fullCapacityData);
      console.log("Has id:", !!fullCapacityData.id);

      mockPrismaCapacityStatus.findUnique.mockResolvedValue(fullCapacityData);

      console.log("Mock setup - findUnique will return:", fullCapacityData);

      const result = await calculateCapacityStatus("MORNING", mockExamDate);

      expect(result.is_full).toBe(true);
      expect(result.advanced_slots_available).toBe(false);
      expect(result.free_slots_available).toBe(false);
    });

    it("should enforce 150 free package limit", async () => {
      // Mock free package full but advanced available with valid capacityData
      const freeFullCapacityData = {
        ...mockCapacityData,
        totalCount: 200,
        freeCount: 150, // Free package at limit
        advancedCount: 50,
      };

      mockPrismaCapacityStatus.findUnique.mockResolvedValue(freeFullCapacityData);

      const result = await calculateCapacityStatus("MORNING", mockExamDate);

      expect(result.free_slots_available).toBe(false); // Free full
      expect(result.advanced_slots_available).toBe(true); // Advanced still available
      expect(result.is_full).toBe(false); // Total not full
    });

    it("should allow advanced package to use remaining capacity", async () => {
      // Mock scenario where free is full but total capacity available
      mockPrismaCapacityStatus.findUnique.mockResolvedValue({
        ...mockCapacityData,
        totalCount: 250,
        freeCount: 150, // Free at limit
        advancedCount: 100, // Advanced can still register
      });

      const eligibility = await checkRegistrationEligibility("MORNING", mockExamDate, "ADVANCED");

      expect(eligibility.allowed).toBe(true);
      expect(eligibility.capacity.advanced_slots_available).toBe(true);
    });

    it("should prevent free registration when free limit reached", async () => {
      
      mockPrismaCapacityStatus.findUnique.mockResolvedValue({
        ...mockCapacityData,
        totalCount: 200,
        freeCount: 150, // Free at limit
        advancedCount: 50,
      });

      const eligibility = await checkRegistrationEligibility("MORNING", mockExamDate, "FREE");

      expect(eligibility.allowed).toBe(false);
      expect(eligibility.reason).toContain("Free package quota reached");
    });
  });

  describe("UI Compliance - Story 3.1 AC1, AC5", () => {
    it("should not expose exact capacity numbers in UI response", async () => {
      
      mockPrismaCapacityStatus.findUnique.mockResolvedValue(mockCapacityData);

      const uiResponse = await getCapacityStatusForUI("MORNING", mockExamDate);

      // Should not contain exact numbers
      expect(uiResponse).not.toHaveProperty("totalCount");
      expect(uiResponse).not.toHaveProperty("freeCount");
      expect(uiResponse).not.toHaveProperty("advancedCount");
      expect(uiResponse).not.toHaveProperty("maxCapacity");
      expect(uiResponse).not.toHaveProperty("freeLimit");

      // Should contain UI-safe information
      expect(uiResponse).toHaveProperty("availability_status");
      expect(uiResponse).toHaveProperty("message");
      expect(uiResponse).toHaveProperty("message_en");
      expect(uiResponse).toHaveProperty("can_register_free");
      expect(uiResponse).toHaveProperty("can_register_advanced");
      expect(uiResponse).toHaveProperty("show_disabled_state");
    });

    it("should provide appropriate Thai/English messages", async () => {
      
      // Test different scenarios
      const scenarios = [
        {
          data: { ...mockCapacityData, totalCount: 50, freeCount: 25, advancedCount: 25 },
          expectedMessage: "ยังมีที่นั่งว่าง",
          expectedMessageEn: "Seats available",
        },
        {
          data: { ...mockCapacityData, totalCount: 300, freeCount: 150, advancedCount: 150 },
          expectedMessage: "เซสชันเต็มแล้ว",
          expectedMessageEn: "Session is full",
        },
        {
          data: { ...mockCapacityData, totalCount: 200, freeCount: 150, advancedCount: 50 },
          expectedMessage: "Free Package เต็มแล้ว - เหลือเฉพาะ Advanced Package",
          expectedMessageEn: "Free Package full - Only Advanced Package available",
        },
      ];

      for (const scenario of scenarios) {
        mockPrismaCapacityStatus.findUnique.mockResolvedValue(scenario.data);
        const response = await getCapacityStatusForUI("MORNING", mockExamDate);

        expect(response.message).toContain(scenario.expectedMessage);
        expect(response.message_en).toContain(scenario.expectedMessageEn);
      }
    });

    it("should indicate disabled state for full sessions", async () => {
      
      mockPrismaCapacityStatus.findUnique.mockResolvedValue({
        ...mockCapacityData,
        totalCount: 300,
        freeCount: 150,
        advancedCount: 150,
      });

      const response = await getCapacityStatusForUI("MORNING", mockExamDate);

      expect(response.show_disabled_state).toBe(true);
      expect(response.can_register_free).toBe(false);
      expect(response.can_register_advanced).toBe(false);
    });
  });

  describe("Capacity Update Transactions - Story 3.1 AC2", () => {
    it("should update capacity atomically for free registration", async () => {
      
      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          capacityStatus: {
            findUnique: jest.fn().mockResolvedValue(mockCapacityData),
            update: jest.fn().mockResolvedValue({}),
          },
        });
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await updateCapacityOnRegistration("MORNING", mockExamDate, "FREE");

      expect(result).toBe(true);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should prevent registration when capacity exceeded", async () => {

      const mockTransaction = jest.fn(async (callback) => {
        // This should cause the transaction to throw "Total capacity exceeded" error
        throw new Error("Total capacity exceeded");
      });

      mockPrisma.$transaction = mockTransaction;

      // Should return false when trying to exceed capacity
      const result = await updateCapacityOnRegistration("MORNING", mockExamDate, "FREE");
      expect(result).toBe(false);
    });

    it("should prevent free registration when free limit exceeded", async () => {

      const mockTransaction = jest.fn(async (callback) => {
        // This should cause the transaction to throw "Free package limit exceeded" error
        throw new Error("Free package limit exceeded");
      });

      mockPrisma.$transaction = mockTransaction;

      // Should return false when trying to exceed free limit
      const result = await updateCapacityOnRegistration("MORNING", mockExamDate, "FREE");
      expect(result).toBe(false);
    });
  });

  describe("Business Logic Edge Cases", () => {
    it("should handle mixed registration scenarios correctly", async () => {
      
      // Scenario: 100 free, 100 advanced (total 200, within all limits)
      mockPrismaCapacityStatus.findUnique.mockResolvedValue({
        ...mockCapacityData,
        totalCount: 200,
        freeCount: 100,
        advancedCount: 100,
      });

      const [freeEligibility, advancedEligibility] = await Promise.all([
        checkRegistrationEligibility("MORNING", mockExamDate, "FREE"),
        checkRegistrationEligibility("MORNING", mockExamDate, "ADVANCED"),
      ]);

      expect(freeEligibility.allowed).toBe(true); // Free still available (100 < 150)
      expect(advancedEligibility.allowed).toBe(true); // Advanced available (200 < 300)
    });

    it("should initialize capacity records when they don't exist", async () => {
      
      // Mock no existing capacity record
      mockPrismaCapacityStatus.findUnique.mockResolvedValue(null);
      mockPrismaCapacityStatus.create.mockResolvedValue({
        ...mockCapacityData,
        totalCount: 0,
        freeCount: 0,
        advancedCount: 0,
      });

      const result = await calculateCapacityStatus("MORNING", mockExamDate);

      expect(mockPrismaCapacityStatus.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionTime: "MORNING",
          examDate: mockExamDate,
          totalCount: 0,
          freeCount: 0,
          advancedCount: 0,
          maxCapacity: CAPACITY_CONSTRAINTS.TOTAL_CAPACITY,
          freeLimit: CAPACITY_CONSTRAINTS.FREE_PACKAGE_LIMIT,
          availabilityStatus: "AVAILABLE",
        }),
      });

      expect(result.current_free_count).toBe(0);
      expect(result.current_advanced_count).toBe(0);
      expect(result.is_full).toBe(false);
    });
  });
});