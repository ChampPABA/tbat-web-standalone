import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  generateExamCode,
  validateExamCode,
  checkCodeUniqueness,
  generateRandomString,
  getExamCodeDetails,
  markExamCodeAsUsed,
  deactivateExamCode,
} from "../../lib/exam-code";
import { prisma } from "../../lib/prisma";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    examCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
    pDFDownload: {
      deleteMany: jest.fn(),
    },
    userSession: {
      deleteMany: jest.fn(),
    },
    pDPAConsent: {
      deleteMany: jest.fn(),
    },
    payment: {
      deleteMany: jest.fn(),
    },
    examResult: {
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrismaExamCode = prisma.examCode as {
  findUnique: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
};

const mockPrismaSecurityLog = prisma.securityLog as {
  create: jest.MockedFunction<any>;
};

const mockPrismaUser = prisma.user as {
  findUnique: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
};

describe("Exam Code Generation Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateRandomString", () => {
    it("should generate a string of the specified length", async () => {
      const length = 8;
      const result = await generateRandomString(length);
      expect(result).toHaveLength(length);
      expect(result).toMatch(/^[A-Z0-9]+$/);
    });

    it("should generate different strings on multiple calls", async () => {
      const results = await Promise.all([
        generateRandomString(8),
        generateRandomString(8),
        generateRandomString(8),
      ]);
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe("checkCodeUniqueness", () => {
    it("should return true when code is unique", async () => {
      mockPrismaExamCode.findUnique.mockResolvedValue(null);
      const isUnique = await checkCodeUniqueness("FREE-A1B2-BIOLOGY");
      expect(isUnique).toBe(true);
    });

    it("should return false when code already exists", async () => {
      mockPrismaExamCode.findUnique.mockResolvedValue({ id: "1", code: "FREE-A1B2-BIOLOGY" });
      const isUnique = await checkCodeUniqueness("FREE-A1B2-BIOLOGY");
      expect(isUnique).toBe(false);
    });
  });

  describe("generateExamCode", () => {
    it("should generate FREE package code with subject", async () => {
      mockPrismaExamCode.findUnique.mockResolvedValue(null);
      mockPrismaExamCode.create.mockResolvedValue({
        id: "1",
        code: "FREE-A1B2-BIOLOGY",
        packageType: "FREE",
        subject: "BIOLOGY",
        generatedAt: new Date(),
      });
      mockPrismaSecurityLog.create.mockResolvedValue({});

      const result = await generateExamCode({
        packageType: "FREE",
        subject: "BIOLOGY",
        userId: "user123",
      });

      expect(result.code).toMatch(/^FREE-[A-Z0-9]{4}-BIOLOGY$/);
      expect(result.packageType).toBe("FREE");
      expect(result.subject).toBe("BIOLOGY");
    });

    it("should generate ADVANCED package code without subject", async () => {
      mockPrismaExamCode.findUnique.mockResolvedValue(null);
      mockPrismaExamCode.create.mockResolvedValue({
        id: "2",
        code: "ADV-ABCD1234",
        packageType: "ADVANCED",
        subject: null,
        generatedAt: new Date(),
      });
      mockPrismaSecurityLog.create.mockResolvedValue({});

      const result = await generateExamCode({
        packageType: "ADVANCED",
        userId: "user123",
      });

      expect(result.code).toMatch(/^ADV-[A-Z0-9]{8}$/);
      expect(result.packageType).toBe("ADVANCED");
      expect(result.subject).toBeNull();
    });

    it("should throw error when FREE package missing subject", async () => {
      await expect(
        generateExamCode({
          packageType: "FREE",
          userId: "user123",
        })
      ).rejects.toThrow("Subject is required for FREE package exam codes");
    });

    it("should throw error when ADVANCED package has subject", async () => {
      await expect(
        generateExamCode({
          packageType: "ADVANCED",
          subject: "BIOLOGY",
          userId: "user123",
        })
      ).rejects.toThrow("Subject should not be specified for ADVANCED package exam codes");
    });

    it("should handle collision and retry generation", async () => {
      mockPrismaExamCode.findUnique
        .mockResolvedValueOnce({ id: "1", code: "FREE-COLLISION-BIOLOGY" })
        .mockResolvedValueOnce(null);
      
      mockPrismaExamCode.create.mockResolvedValue({
        id: "2",
        code: "FREE-U2I3-BIOLOGY",
        packageType: "FREE",
        subject: "BIOLOGY",
        generatedAt: new Date(),
      });
      mockPrismaSecurityLog.create.mockResolvedValue({});

      const result = await generateExamCode({
        packageType: "FREE",
        subject: "BIOLOGY",
        userId: "user123",
      });

      expect(prisma.examCode.findUnique).toHaveBeenCalledTimes(2);
      expect(result.code).toMatch(/^FREE-[A-Z0-9]{4}-BIOLOGY$/);
    });
  });

  describe("validateExamCode", () => {
    it("should validate FREE package code format", async () => {
      expect(await validateExamCode("FREE-A1B2-BIOLOGY")).toBe(true);
      expect(await validateExamCode("FREE-1234-CHEMISTRY")).toBe(true);
      expect(await validateExamCode("FREE-Z9X8-PHYSICS")).toBe(true);
    });

    it("should validate ADVANCED package code format", async () => {
      expect(await validateExamCode("ADV-A1B2")).toBe(true);
      expect(await validateExamCode("ADV-1234")).toBe(true);
    });

    it("should reject invalid code formats", async () => {
      expect(await validateExamCode("INVALID-CODE")).toBe(false);
      expect(await validateExamCode("FREE-SHORT-BIOLOGY")).toBe(false);
      expect(await validateExamCode("FREE-ABCD1234-MATH")).toBe(false);
      expect(await validateExamCode("ADV-TOOLONGCODE")).toBe(false);
    });
  });

  describe("getExamCodeDetails", () => {
    it("should return exam code details with user info", async () => {
      const mockExamCode = {
        id: "1",
        code: "FREE-A1B2-BIOLOGY",
        packageType: "FREE",
        subject: "BIOLOGY",
        expiresAt: new Date(Date.now() + 86400000),
        usedAt: null,
        user: {
          id: "user123",
          email: "test@example.com",
          thaiName: "ทดสอบ",
        },
        sessionCapacity: null,
      };

      mockPrismaExamCode.findUnique.mockResolvedValue(mockExamCode);

      const result = await getExamCodeDetails("FREE-A1B2-BIOLOGY");

      expect(result).toMatchObject({
        code: "FREE-A1B2-BIOLOGY",
        isExpired: false,
        isUsed: false,
      });
    });

    it("should identify expired codes", async () => {
      const mockExamCode = {
        id: "1",
        code: "FREE-A1B2-BIOLOGY",
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago (expired)
        usedAt: null,
      };

      mockPrismaExamCode.findUnique.mockResolvedValue(mockExamCode);

      const result = await getExamCodeDetails("FREE-A1B2-BIOLOGY");

      expect(result?.isExpired).toBe(true);
    });

    it("should return null for non-existent code", async () => {
      mockPrismaExamCode.findUnique.mockResolvedValue(null);

      const result = await getExamCodeDetails("NONEXISTENT");

      expect(result).toBeNull();
    });
  });

  describe("markExamCodeAsUsed", () => {
    it("should mark code as used and create audit log", async () => {
      mockPrismaExamCode.update.mockResolvedValue({});
      mockPrismaSecurityLog.create.mockResolvedValue({});

      await markExamCodeAsUsed("FREE-A1B2-BIOLOGY", "user123");

      expect(prisma.examCode.update).toHaveBeenCalledWith({
        where: { code: "FREE-A1B2-BIOLOGY" },
        data: expect.objectContaining({
          usedAt: expect.any(Date),
          isUsed: true,
        }),
      });
    });
  });

  describe("deactivateExamCode", () => {
    it("should deactivate code with reason", async () => {
      mockPrismaExamCode.update.mockResolvedValue({});
      mockPrismaSecurityLog.create.mockResolvedValue({});

      await deactivateExamCode("FREE-A1B2-BIOLOGY", "Expired");

      expect(prisma.examCode.update).toHaveBeenCalledWith({
        where: { code: "FREE-A1B2-BIOLOGY" },
        data: expect.objectContaining({
          isUsed: true,
          usedAt: expect.any(Date),
        }),
      });
    });
  });
});