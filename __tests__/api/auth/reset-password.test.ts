import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/reset-password/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    passwordReset: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const mockPrisma = prisma as any;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("/api/auth/reset-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/reset-password", () => {
    it("should successfully reset password with valid token", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: "user-123",
        resetToken: "valid-token",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        isUsed: false,
        user: {
          id: "user-123",
          email: "test@example.com",
          thaiName: "ทดสอบ ระบบ",
        },
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      (mockBcrypt.hash as any).mockResolvedValue("hashed-new-password");

      // Mock successful transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Mock the transaction operations
        mockPrisma.user.update.mockResolvedValue({});
        mockPrisma.passwordReset.update.mockResolvedValue({});
        mockPrisma.securityLog.create.mockResolvedValue({});

        return await callback({
          user: mockPrisma.user,
          passwordReset: mockPrisma.passwordReset,
          securityLog: mockPrisma.securityLog,
        });
      });

      const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Jest Test Agent",
        },
        body: JSON.stringify({
          token: "valid-token",
          password: "NewPassword123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว");

      // Verify password was hashed
      expect(mockBcrypt.hash).toHaveBeenCalledWith("NewPassword123", 12);
    });

    it("should reject invalid token", async () => {
      mockPrisma.passwordReset.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: "invalid-token",
          password: "NewPassword123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or expired reset token");
    });

    it("should reject expired token", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: "user-123",
        resetToken: "expired-token",
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (expired)
        isUsed: false,
        user: {
          id: "user-123",
          email: "test@example.com",
          thaiName: "ทดสอบ ระบบ",
        },
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);

      const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: "expired-token",
          password: "NewPassword123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Reset token has expired. Please request a new one.");
    });

    it("should reject already used token", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: "user-123",
        resetToken: "used-token",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Valid expiry
        isUsed: true, // Already used
        user: {
          id: "user-123",
          email: "test@example.com",
          thaiName: "ทดสอบ ระบบ",
        },
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);

      const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: "used-token",
          password: "NewPassword123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Reset token has already been used");
    });

    it("should validate password strength", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: "valid-token",
          password: "weak", // Too weak
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details.fieldErrors.password).toContain("Password must be at least 8 characters");
    });

    it("should require uppercase, lowercase, and number in password", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: "valid-token",
          password: "onlylowercase", // Missing uppercase and numbers
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details.fieldErrors.password).toContain("Password must contain at least one uppercase letter");
      expect(data.details.fieldErrors.password).toContain("Password must contain at least one number");
    });

    it("should handle database transaction errors", async () => {
      const mockPasswordReset = {
        id: "reset-123",
        userId: "user-123",
        resetToken: "valid-token",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isUsed: false,
        user: {
          id: "user-123",
          email: "test@example.com",
          thaiName: "ทดสอบ ระบบ",
        },
      };

      mockPrisma.passwordReset.findUnique.mockResolvedValue(mockPasswordReset);
      (mockBcrypt.hash as any).mockResolvedValue("hashed-new-password");

      // Mock transaction failure
      mockPrisma.$transaction.mockRejectedValue(new Error("Database transaction failed"));

      const request = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Jest Test Agent",
        },
        body: JSON.stringify({
          token: "valid-token",
          password: "NewPassword123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("An error occurred while resetting your password");

      // Verify security event was logged for the failure
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: {
          eventType: "AUTHENTICATION_FAILED",
          ipAddress: "127.0.0.1",
          userAgent: "Jest Test Agent",
          metadata: {
            action: "PASSWORD_RESET_FAILED",
            error: "Database transaction failed",
            timestamp: expect.any(String),
          },
        },
      });
    });
  });
});