import { rateLimitConfigs } from "@/lib/rate-limit";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}));

describe("Rate Limiting Middleware", () => {
  beforeEach(() => {
    // Clear any rate limit state between tests
    jest.clearAllMocks();
  });

  describe("rateLimitConfigs", () => {
    it("should have auth configuration", () => {
      expect(rateLimitConfigs.auth).toBeDefined();
      expect(rateLimitConfigs.auth.max).toBe(5);
      expect(rateLimitConfigs.auth.windowMs).toBe(15 * 60 * 1000);
    });

    it("should have register configuration", () => {
      expect(rateLimitConfigs.register).toBeDefined();
      expect(rateLimitConfigs.register.max).toBe(3);
      expect(rateLimitConfigs.register.windowMs).toBe(60 * 60 * 1000);
    });

    it("should have payment configuration", () => {
      expect(rateLimitConfigs.payment).toBeDefined();
      expect(rateLimitConfigs.payment.max).toBe(10);
    });

    it("should have appropriate error messages", () => {
      expect(rateLimitConfigs.auth.message).toContain("authentication");
      expect(rateLimitConfigs.register.message).toContain("registration");
      expect(rateLimitConfigs.payment.message).toContain("payment");
    });
  });
});
