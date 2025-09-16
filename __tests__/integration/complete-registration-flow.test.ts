import { NextRequest } from "next/server";
import { POST } from "../../app/api/auth/register/route";

// Mock the external dependencies
jest.mock("../../lib/email", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../../lib/exam-code", () => ({
  generateExamCode: jest.fn(),
}));

import { sendEmail } from "../../lib/email";
import { generateExamCode } from "../../lib/exam-code";

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const mockGenerateExamCode = generateExamCode as jest.MockedFunction<typeof generateExamCode>;

describe("Complete Registration Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful email sending
    mockSendEmail.mockResolvedValue({
      success: true,
      data: { messageId: "test-email-id" }
    });

    // Mock successful exam code generation
    mockGenerateExamCode.mockResolvedValue({
      code: "FREE-A1B2-BIOLOGY",
      packageType: "FREE",
      subject: "BIOLOGY",
      generatedAt: new Date(),
    });
  });

  describe("FREE Package Registration Flow", () => {
    test("should complete full FREE package registration with email and exam code", async () => {
      const requestBody = {
        email: "test.free@example.com",
        password: "password123",
        name: "Test Free User",
        thaiName: "นายทดสอบ ฟรี",
        phoneNumber: "0812345678",
        pdpaConsent: true,
        packageType: "FREE",
        subject: "BIOLOGY"
      };

      const request = new NextRequest("http://localhost:3001/api/auth/register", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const result = await response.json();

      // Test registration success
      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({
        email: "test.free@example.com",
        thaiName: "นายทดสอบ ฟรี",
      });

      // Test exam code generation
      expect(mockGenerateExamCode).toHaveBeenCalledWith({
        packageType: "FREE",
        subject: "BIOLOGY",
        userId: expect.any(String),
      });

      expect(result.examCode).toMatchObject({
        code: "FREE-A1B2-BIOLOGY",
        packageType: "FREE",
        subject: "BIOLOGY",
      });

      // Test email sending
      expect(mockSendEmail).toHaveBeenCalledTimes(2);

      // Welcome email
      expect(mockSendEmail).toHaveBeenCalledWith(
        "test.free@example.com",
        "registration",
        {
          name: "นายทดสอบ ฟรี",
          email: "test.free@example.com"
        }
      );

      // Exam ticket email
      expect(mockSendEmail).toHaveBeenCalledWith(
        "test.free@example.com",
        "examTicket",
        expect.objectContaining({
          name: "นายทดสอบ ฟรี",
          code: "FREE-A1B2-BIOLOGY",
          sessionTime: "09:00-12:00 น.",
          subjects: ["ชีววิทยา"]
        })
      );

      // Test email status in response
      expect(result.emailStatus).toEqual({
        welcomeEmail: true,
        examTicketEmail: true,
      });
    });

    test("should fail FREE package registration without subject", async () => {
      const requestBody = {
        email: "test.free.nosubject@example.com",
        password: "password123",
        name: "Test Free User",
        thaiName: "นายทดสอบ ฟรี",
        phoneNumber: "0812345678",
        pdpaConsent: true,
        packageType: "FREE",
        // Missing subject
      };

      const request = new NextRequest("http://localhost:3001/api/auth/register", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain("Subject selection is required for FREE package");

      // Should not generate exam code or send emails
      expect(mockGenerateExamCode).not.toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalledTimes(1); // Only welcome email
    });
  });

  describe("ADVANCED Package Registration Flow", () => {
    test("should complete full ADVANCED package registration", async () => {
      mockGenerateExamCode.mockResolvedValue({
        code: "ADV-X9Y8",
        packageType: "ADVANCED",
        generatedAt: new Date(),
      });

      const requestBody = {
        email: "test.advanced@example.com",
        password: "password123",
        name: "Test Advanced User",
        thaiName: "นางสาวทดสอบ แอดวานซ์",
        phoneNumber: "0823456789",
        pdpaConsent: true,
        packageType: "ADVANCED"
        // No subject needed
      };

      const request = new NextRequest("http://localhost:3001/api/auth/register", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const result = await response.json();

      // Test registration success
      expect(response.status).toBe(201);
      expect(result.success).toBe(true);

      // Test exam code generation
      expect(mockGenerateExamCode).toHaveBeenCalledWith({
        packageType: "ADVANCED",
        userId: expect.any(String),
      });

      expect(result.examCode).toMatchObject({
        code: "ADV-X9Y8",
        packageType: "ADVANCED",
      });

      // Test exam ticket email for ADVANCED (all subjects)
      expect(mockSendEmail).toHaveBeenCalledWith(
        "test.advanced@example.com",
        "examTicket",
        expect.objectContaining({
          name: "นางสาวทดสอบ แอดวานซ์",
          code: "ADV-X9Y8",
          subjects: ["ชีววิทยา", "เคมี", "ฟิสิกส์"]
        })
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle email failure gracefully", async () => {
      // Mock email failure
      mockSendEmail
        .mockResolvedValueOnce({ success: false, error: "SMTP Error" }) // Welcome email fails
        .mockResolvedValueOnce({ success: true, data: { messageId: "ticket-id" } }); // Ticket email succeeds

      const requestBody = {
        email: "test.email.fail@example.com",
        password: "password123",
        name: "Test Email Fail",
        thaiName: "นายทดสอบ อีเมลล์",
        phoneNumber: "0834567890",
        pdpaConsent: true,
        packageType: "FREE",
        subject: "CHEMISTRY"
      };

      const request = new NextRequest("http://localhost:3001/api/auth/register", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const result = await response.json();

      // Registration should still succeed
      expect(response.status).toBe(201);
      expect(result.success).toBe(true);

      // Email status should reflect the failures
      expect(result.emailStatus).toEqual({
        welcomeEmail: false,
        examTicketEmail: true,
      });
    });

    test("should handle exam code generation failure gracefully", async () => {
      // Mock exam code generation failure
      mockGenerateExamCode.mockRejectedValue(new Error("Database connection failed"));

      const requestBody = {
        email: "test.examcode.fail@example.com",
        password: "password123",
        name: "Test ExamCode Fail",
        thaiName: "นายทดสอบ รหัสสอบ",
        phoneNumber: "0845678901",
        pdpaConsent: true,
        packageType: "FREE",
        subject: "PHYSICS"
      };

      const request = new NextRequest("http://localhost:3001/api/auth/register", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const result = await response.json();

      // Registration should still succeed
      expect(response.status).toBe(201);
      expect(result.success).toBe(true);

      // No exam code should be returned
      expect(result.examCode).toBeNull();

      // Only welcome email should be sent
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(result.emailStatus).toEqual({
        welcomeEmail: true,
        examTicketEmail: false,
      });
    });
  });

  describe("Subject Translation", () => {
    test("should translate subjects correctly for Thai email", async () => {
      const subjects = ["BIOLOGY", "CHEMISTRY", "PHYSICS"];
      const expectedTranslations = [
        { subject: "BIOLOGY", thai: ["ชีววิทยา"] },
        { subject: "CHEMISTRY", thai: ["เคมี"] },
        { subject: "PHYSICS", thai: ["ฟิสิกส์"] }
      ];

      for (const { subject, thai } of expectedTranslations) {
        jest.clearAllMocks();

        const requestBody = {
          email: `test.${subject.toLowerCase()}@example.com`,
          password: "password123",
          name: `Test ${subject}`,
          thaiName: `นายทดสอบ ${subject}`,
          phoneNumber: "0856789012",
          pdpaConsent: true,
          packageType: "FREE",
          subject: subject as "BIOLOGY" | "CHEMISTRY" | "PHYSICS"
        };

        const request = new NextRequest("http://localhost:3001/api/auth/register", {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        });

        await POST(request);

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.any(String),
          "examTicket",
          expect.objectContaining({
            subjects: thai
          })
        );
      }
    });
  });
});