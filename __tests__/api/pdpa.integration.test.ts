import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET as getConsent, POST as postConsent } from "@/app/api/pdpa/consent/route";
import { GET as exportData } from "@/app/api/pdpa/export/route";
import { DELETE as deleteData } from "@/app/api/pdpa/delete/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pDPAConsent: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
    examCode: {
      deleteMany: jest.fn(),
    },
    examResult: {
      deleteMany: jest.fn(),
    },
    payment: {
      deleteMany: jest.fn(),
    },
    pDFDownload: {
      deleteMany: jest.fn(),
    },
    userSession: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as any;

describe("PDPA API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("GET /api/pdpa/consent", () => {
    it("should return user consent history when authenticated", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      mockPrisma.pDPAConsent.findMany.mockResolvedValue([
        {
          id: "consent1",
          userId: "user123",
          consentType: "marketing",
          status: "granted",
          grantedAt: new Date(),
          revokedAt: null,
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/pdpa/consent");
      const response = await getConsent();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(mockPrisma.pDPAConsent.findMany).toHaveBeenCalledWith({
        where: { userId: "user123" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/pdpa/consent");
      const response = await getConsent();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/pdpa/consent", () => {
    it("should record new consent when valid data provided", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      const consentData = {
        consentType: "marketing",
        granted: true,
      };

      mockPrisma.pDPAConsent.create.mockResolvedValue({
        id: "consent1",
        userId: "user123",
        consentType: "marketing",
        status: "granted",
        grantedAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/pdpa/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid-token",
        },
        body: JSON.stringify(consentData),
      });

      // Mock CSRF token validation
      jest.spyOn(request, "json").mockResolvedValue(consentData);

      const response = await postConsent(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should revoke consent when granted is false", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      const consentData = {
        consentType: "marketing",
        granted: false,
      };

      mockPrisma.pDPAConsent.create.mockResolvedValue({
        id: "consent1",
        userId: "user123",
        consentType: "marketing",
        status: "revoked",
        revokedAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/pdpa/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid-token",
        },
        body: JSON.stringify(consentData),
      });

      jest.spyOn(request, "json").mockResolvedValue(consentData);

      const response = await postConsent(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("GET /api/pdpa/export", () => {
    it("should export user data in JSON format", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      const userData = {
        id: "user123",
        email: "test@example.com",
        thaiName: "ทดสอบ",
        phone: "0812345678",
        school: "Test School",
        packageType: "FREE",
        createdAt: new Date(),
        examCodes: [
          {
            id: "code1",
            code: "FREE-ABCD1234-BIOLOGY",
            packageType: "FREE",
            subject: "BIOLOGY",
          },
        ],
        examResults: [],
        payments: [],
        pdfDownloads: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(userData);

      const request = new NextRequest("http://localhost:3000/api/pdpa/export?format=json");
      const response = await exportData(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Content-Disposition")).toContain("user_data_");
    });

    it("should export user data in CSV format", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      const userData = {
        id: "user123",
        email: "test@example.com",
        thaiName: "ทดสอบ",
        phone: "0812345678",
        school: "Test School",
        packageType: "FREE",
        createdAt: new Date(),
        examCodes: [],
        examResults: [],
        payments: [],
        pdfDownloads: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue(userData);

      const request = new NextRequest("http://localhost:3000/api/pdpa/export?format=csv");
      const response = await exportData(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv");
      expect(response.headers.get("Content-Disposition")).toContain("user_data_");
    });
  });

  describe("DELETE /api/pdpa/delete", () => {
    it("should delete all user data when confirmed", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      const deleteRequest = {
        reason: "No longer using the service",
        confirmDelete: true,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      mockPrisma.examCode.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.examResult.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.payment.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.pDFDownload.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.pDPAConsent.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.delete.mockResolvedValue({ id: "user123" });

      const request = new NextRequest("http://localhost:3000/api/pdpa/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid-token",
        },
        body: JSON.stringify(deleteRequest),
      });

      jest.spyOn(request, "json").mockResolvedValue(deleteRequest);

      const response = await deleteData(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Your data has been successfully deleted");
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user123" },
      });
    });

    it("should reject deletion without confirmation", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      const deleteRequest = {
        reason: "No longer using the service",
        confirmDelete: false,
      };

      const request = new NextRequest("http://localhost:3000/api/pdpa/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid-token",
        },
        body: JSON.stringify(deleteRequest),
      });

      jest.spyOn(request, "json").mockResolvedValue(deleteRequest);

      const response = await deleteData(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request");
    });

    it("should handle deletion errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user123", email: "test@example.com" },
      } as any);

      const deleteRequest = {
        reason: "No longer using the service",
        confirmDelete: true,
      };

      mockPrisma.$transaction.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/pdpa/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "valid-token",
        },
        body: JSON.stringify(deleteRequest),
      });

      jest.spyOn(request, "json").mockResolvedValue(deleteRequest);

      const response = await deleteData(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete user data");
    });
  });
});