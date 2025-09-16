import { z } from "zod";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}));

import {
  commonSchemas,
  apiSchemas,
  validateThaiInput,
  sanitizeInput,
  validatePDPACompliance,
} from "@/lib/api-validation";

describe("API Validation", () => {
  describe("Common Schemas", () => {
    describe("email validation", () => {
      it("should accept valid email", () => {
        const result = commonSchemas.email.safeParse("user@example.com");
        expect(result.success).toBe(true);
      });

      it("should reject invalid email", () => {
        const result = commonSchemas.email.safeParse("invalid-email");
        expect(result.success).toBe(false);
      });
    });

    describe("Thai phone validation", () => {
      it("should accept valid Thai mobile number", () => {
        const result = commonSchemas.thaiPhone.safeParse("0812345678");
        expect(result.success).toBe(true);
      });

      it("should accept Thai number with country code", () => {
        const result = commonSchemas.thaiPhone.safeParse("+66812345678");
        expect(result.success).toBe(true);
      });

      it("should reject invalid phone number", () => {
        const result = commonSchemas.thaiPhone.safeParse("123456");
        expect(result.success).toBe(false);
      });
    });

    describe("password validation", () => {
      it("should accept strong password", () => {
        const result = commonSchemas.password.safeParse("StrongPass123");
        expect(result.success).toBe(true);
      });

      it("should reject password without uppercase", () => {
        const result = commonSchemas.password.safeParse("weakpass123");
        expect(result.success).toBe(false);
      });

      it("should reject password without number", () => {
        const result = commonSchemas.password.safeParse("WeakPassword");
        expect(result.success).toBe(false);
      });

      it("should reject short password", () => {
        const result = commonSchemas.password.safeParse("Short1");
        expect(result.success).toBe(false);
      });
    });

    describe("PDPA consent validation", () => {
      it("should accept true consent", () => {
        const result = commonSchemas.pdpaConsent.safeParse(true);
        expect(result.success).toBe(true);
      });

      it("should reject false consent", () => {
        const result = commonSchemas.pdpaConsent.safeParse(false);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("API Schemas", () => {
    describe("updateUser schema", () => {
      it("should accept valid update data", () => {
        const data = {
          name: "John Doe",
          thaiName: "จอห์น โด",
          phoneNumber: "0812345678",
        };
        const result = apiSchemas.updateUser.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept partial updates", () => {
        const data = { name: "John Doe" };
        const result = apiSchemas.updateUser.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should reject invalid phone in update", () => {
        const data = { phoneNumber: "123" };
        const result = apiSchemas.updateUser.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("payment schema", () => {
      it("should accept valid payment data", () => {
        const data = {
          packageType: "ADVANCED",
          amount: 690,
          currency: "THB",
        };
        const result = apiSchemas.createPayment.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should reject invalid package type", () => {
        const data = {
          packageType: "INVALID",
          amount: 690,
          currency: "THB",
        };
        const result = apiSchemas.createPayment.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject non-THB currency", () => {
        const data = {
          packageType: "ADVANCED",
          amount: 690,
          currency: "USD",
        };
        const result = apiSchemas.createPayment.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Utility Functions", () => {
    describe("sanitizeInput", () => {
      it("should escape HTML characters", () => {
        const input = '<script>alert("XSS")</script>';
        const output = sanitizeInput(input);
        expect(output).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;");
      });

      it("should handle normal text", () => {
        const input = "Normal text without HTML";
        const output = sanitizeInput(input);
        expect(output).toBe("Normal text without HTML");
      });
    });

    describe("validateThaiInput", () => {
      it("should detect Thai characters", () => {
        expect(validateThaiInput("สวัสดี")).toBe(true);
        expect(validateThaiInput("Hello สวัสดี")).toBe(true);
      });

      it("should return false for non-Thai text", () => {
        expect(validateThaiInput("Hello World")).toBe(false);
        expect(validateThaiInput("12345")).toBe(false);
      });
    });

    describe("validatePDPACompliance", () => {
      it("should validate valid consent", () => {
        const validation = {
          hasConsent: true,
          consentDate: new Date(),
          consentVersion: "1.0",
        };
        expect(validatePDPACompliance(validation)).toBe(true);
      });

      it("should reject missing consent", () => {
        const validation = {
          hasConsent: false,
        };
        expect(validatePDPACompliance(validation)).toBe(false);
      });

      it("should reject expired consent", () => {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const validation = {
          hasConsent: true,
          consentDate: twoYearsAgo,
        };
        expect(validatePDPACompliance(validation)).toBe(false);
      });
    });
  });
});
