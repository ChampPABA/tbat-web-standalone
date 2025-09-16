import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/forgot-password/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendEmail: jest.fn(),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-token-12345'
  }
});

const mockPrisma = prisma as any;
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe("/api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should return success for existing user and send password reset email", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        thaiName: "ทดสอบ ระบบ",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordReset.create.mockResolvedValue({});
      mockPrisma.securityLog.create.mockResolvedValue({});
      mockSendEmail.mockResolvedValue({ success: true });

      const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Jest Test Agent",
        },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("หากอีเมลของคุณมีอยู่ในระบบ");

      // Verify password reset token was created
      expect(mockPrisma.passwordReset.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          resetToken: "mock-uuid-token-12345",
          expiresAt: expect.any(Date),
        },
      });

      // Verify email was sent
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: "รีเซ็ตรหัสผ่าน - TBAT Mock Exam Platform",
        html: expect.stringContaining(mockUser.thaiName),
      });

      // Verify security logging
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: {
          eventType: "PASSWORD_RESET_REQUEST",
          userId: mockUser.id,
          ipAddress: "127.0.0.1",
          userAgent: "Jest Test Agent",
          metadata: {
            email: mockUser.email,
            timestamp: expect.any(String),
          },
        },
      });
    });

    it("should return success even for non-existent user (security measure)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("หากอีเมลของคุณมีอยู่ในระบบ");

      // Verify no password reset token was created
      expect(mockPrisma.passwordReset.create).not.toHaveBeenCalled();

      // Verify no email was sent
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("should validate email format", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid email format");
    });

    it("should handle email sending failure gracefully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        thaiName: "ทดสอบ ระบบ",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordReset.create.mockResolvedValue({ resetToken: "mock-uuid-token-12345" });
      mockPrisma.passwordReset.delete.mockResolvedValue({});
      mockSendEmail.mockRejectedValue(new Error("Email service error"));

      const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to send reset email. Please try again.");

      // Verify token cleanup was attempted
      expect(mockPrisma.passwordReset.delete).toHaveBeenCalledWith({
        where: { resetToken: "mock-uuid-token-12345" },
      });
    });

    it("should handle database unavailability", async () => {
      // Mock prisma as null/undefined
      const originalPrisma = (prisma as any);
      (global as any).prisma = null;

      const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe("Database not available");

      // Restore prisma
      (global as any).prisma = originalPrisma;
    });
  });
});