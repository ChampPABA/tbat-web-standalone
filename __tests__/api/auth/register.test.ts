import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const mockPrisma = prisma as any;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("/api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register new user successfully without email verification", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      (mockBcrypt.hash as any).mockResolvedValue("hashed-password");

      const newUser = {
        id: "user-123",
        email: "newuser@example.com",
        thaiName: "ผู้ใช้ใหม่",
        createdAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(newUser);
      mockPrisma.securityLog.create.mockResolvedValue({});

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Jest Test Agent",
        },
        body: JSON.stringify({
          email: "newuser@example.com",
          password: "SecurePass123",
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "0812345678",
          pdpaConsent: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Registration successful. Welcome to TBAT Mock Exam!");
      expect(data.user.email).toBe("newuser@example.com");

      // Verify password was hashed
      expect(mockBcrypt.hash).toHaveBeenCalledWith("SecurePass123", 12);

      // Verify user was created with correct data
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          passwordHash: "hashed-password",
          thaiName: "ผู้ใช้ใหม่",
          phone: "0812345678",
          pdpaConsent: true,
        },
        select: {
          id: true,
          email: true,
          thaiName: true,
          createdAt: true,
        },
      });

      // Verify security logging
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
        data: {
          eventType: "AUTHENTICATION_SUCCESS",
          userId: newUser.id,
          ipAddress: "127.0.0.1",
          userAgent: "Jest Test Agent",
          metadata: {
            action: "USER_REGISTERED",
            email: newUser.email,
            timestamp: expect.any(String),
          },
        },
      });
    });

    it("should reject registration for existing email", async () => {
      const existingUser = {
        id: "user-456",
        email: "existing@example.com",
        thaiName: "ผู้ใช้เดิม",
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "existing@example.com",
          password: "SecurePass123",
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "0812345678",
          pdpaConsent: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("An account with this email already exists");

      // Verify no new user was created
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("should validate email format", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email-format",
          password: "SecurePass123",
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "0812345678",
          pdpaConsent: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details.fieldErrors.email).toContain("Invalid email address");
    });

    it("should validate password strength requirements", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "weak", // Too weak
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "0812345678",
          pdpaConsent: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details.fieldErrors.password).toEqual(
        expect.arrayContaining([
          "Password must be at least 8 characters",
          "Password must contain at least one uppercase letter",
          "Password must contain at least one number",
        ])
      );
    });

    it("should validate Thai phone number format", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "SecurePass123",
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "123456", // Invalid Thai phone number
          pdpaConsent: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details.fieldErrors.phoneNumber).toContain("Invalid Thai phone number");
    });

    it("should require PDPA consent", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "SecurePass123",
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "0812345678",
          pdpaConsent: false, // Not accepted
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details.fieldErrors.pdpaConsent).toContain(
        "You must accept the PDPA terms to register"
      );
    });

    it("should handle database unavailability", async () => {
      // Mock prisma as null/undefined
      const originalPrisma = (prisma as any);
      (global as any).prisma = null;

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "SecurePass123",
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "0812345678",
          pdpaConsent: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe("Database not available");

      // Restore prisma
      (global as any).prisma = originalPrisma;
    });

    it("should normalize email to lowercase", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (mockBcrypt.hash as any).mockResolvedValue("hashed-password");

      const newUser = {
        id: "user-123",
        email: "newuser@example.com", // Should be normalized
        thaiName: "ผู้ใช้ใหม่",
        createdAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(newUser);
      mockPrisma.securityLog.create.mockResolvedValue({});

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "NewUser@EXAMPLE.COM", // Mixed case
          password: "SecurePass123",
          name: "New User",
          thaiName: "ผู้ใช้ใหม่",
          phoneNumber: "0812345678",
          pdpaConsent: true,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      // Verify email was normalized to lowercase in database calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "newuser@example.com" },
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "newuser@example.com",
          passwordHash: "hashed-password",
          thaiName: "ผู้ใช้ใหม่",
          phone: "0812345678",
          pdpaConsent: true,
        },
        select: {
          id: true,
          email: true,
          thaiName: true,
          createdAt: true,
        },
      });
    });
  });
});