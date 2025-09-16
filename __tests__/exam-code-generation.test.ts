import { generateExamCode, validateExamCode, generateRandomString } from "../lib/exam-code";

// Mock Prisma client
jest.mock("../lib/prisma", () => ({
  prisma: {
    examCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock monitoring
jest.mock("../lib/monitoring", () => ({
  auditLog: jest.fn(),
}));

describe("Exam Code Generation - Story 3.1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("4-character XXXX format", () => {
    it("should generate 4-character random string", async () => {
      const randomString = await generateRandomString(4);
      expect(randomString).toHaveLength(4);
      expect(randomString).toMatch(/^[A-Z0-9]{4}$/);
    });

    it("should generate FREE package code with 4-character format", async () => {
      const mockPrisma = require("../lib/prisma").prisma;
      mockPrisma.examCode.findUnique.mockResolvedValue(null); // Code is unique
      mockPrisma.examCode.create.mockResolvedValue({
        id: "test-id",
        code: "FREE-A1B2-BIOLOGY",
        packageType: "FREE",
        subject: "BIOLOGY",
        createdAt: new Date(),
      });

      const result = await generateExamCode({
        packageType: "FREE",
        subject: "BIOLOGY",
        userId: "test-user",
      });

      expect(result.code).toMatch(/^FREE-[A-Z0-9]{4}-BIOLOGY$/);
      expect(result.packageType).toBe("FREE");
      expect(result.subject).toBe("BIOLOGY");
    });

    it("should generate ADVANCED package code with 4-character format", async () => {
      const mockPrisma = require("../lib/prisma").prisma;
      mockPrisma.examCode.findUnique.mockResolvedValue(null); // Code is unique
      mockPrisma.examCode.create.mockResolvedValue({
        id: "test-id",
        code: "ADV-C3D4",
        packageType: "ADVANCED",
        subject: "BIOLOGY",
        createdAt: new Date(),
      });

      const result = await generateExamCode({
        packageType: "ADVANCED",
        userId: "test-user",
      });

      expect(result.code).toMatch(/^ADV-[A-Z0-9]{4}$/);
      expect(result.packageType).toBe("ADVANCED");
    });
  });

  describe("Code validation", () => {
    it("should validate FREE codes with 4-character format", async () => {
      expect(await validateExamCode("FREE-A1B2-BIOLOGY")).toBe(true);
      expect(await validateExamCode("FREE-XY9Z-CHEMISTRY")).toBe(true);
      expect(await validateExamCode("FREE-1234-PHYSICS")).toBe(true);
    });

    it("should validate ADVANCED codes with 4-character format", async () => {
      expect(await validateExamCode("ADV-A1B2")).toBe(true);
      expect(await validateExamCode("ADV-XY9Z")).toBe(true);
      expect(await validateExamCode("ADV-1234")).toBe(true);
    });

    it("should reject 8-character format codes", async () => {
      expect(await validateExamCode("FREE-ABCD1234-BIOLOGY")).toBe(false);
      expect(await validateExamCode("ADV-ABCD1234")).toBe(false);
    });

    it("should reject invalid subject names", async () => {
      expect(await validateExamCode("FREE-A1B2-MATH")).toBe(false);
      expect(await validateExamCode("FREE-A1B2-")).toBe(false);
    });

    it("should reject malformed codes", async () => {
      expect(await validateExamCode("FREE-AB-BIOLOGY")).toBe(false); // Too short
      expect(await validateExamCode("FREE-ABCDE-BIOLOGY")).toBe(false); // Too long
      expect(await validateExamCode("FREE-ab12-BIOLOGY")).toBe(false); // Lowercase
      expect(await validateExamCode("ADV-AB")).toBe(false); // Too short
      expect(await validateExamCode("ADV-ABCDE")).toBe(false); // Too long
    });
  });

  describe("Business logic validation", () => {
    it("should require subject for FREE package", async () => {
      await expect(
        generateExamCode({
          packageType: "FREE",
          userId: "test-user",
        })
      ).rejects.toThrow("Subject is required for FREE package exam codes");
    });

    it("should reject subject for ADVANCED package", async () => {
      await expect(
        generateExamCode({
          packageType: "ADVANCED",
          subject: "BIOLOGY",
          userId: "test-user",
        })
      ).rejects.toThrow("Subject should not be specified for ADVANCED package exam codes");
    });

    it("should accept all three subjects for FREE package", async () => {
      const mockPrisma = require("../lib/prisma").prisma;
      const subjects = ["BIOLOGY", "CHEMISTRY", "PHYSICS"] as const;

      for (const subject of subjects) {
        // Reset mocks for each iteration
        jest.clearAllMocks();

        mockPrisma.examCode.findUnique.mockResolvedValue(null);
        mockPrisma.examCode.create.mockResolvedValue({
          id: "test-id",
          code: `FREE-A1B2-${subject}`,
          packageType: "FREE",
          subject: subject,
          createdAt: new Date(),
        });

        const result = await generateExamCode({
          packageType: "FREE",
          subject,
          userId: "test-user",
        });

        expect(result.code).toMatch(new RegExp(`^FREE-[A-Z0-9]{4}-${subject}$`));
        expect(result.subject).toBe(subject);
      }
    });
  });

  describe("Cryptographic randomness", () => {
    it("should generate unique codes across multiple calls", async () => {
      const codes = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const randomString = await generateRandomString(4);
        codes.add(randomString);
      }

      // Should generate mostly unique codes (allowing for some collisions)
      expect(codes.size).toBeGreaterThan(iterations * 0.9);
    });

    it("should only use allowed characters", async () => {
      for (let i = 0; i < 50; i++) {
        const randomString = await generateRandomString(4);
        expect(randomString).toMatch(/^[A-Z0-9]{4}$/);
      }
    });
  });
});