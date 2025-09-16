import { PRICES, verifyWebhookSignature, stripe } from "@/lib/stripe";
import Stripe from "stripe";

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  })),
}));

describe("Stripe Service", () => {
  describe("Price Configuration", () => {
    it("should have correct prices in satangs", () => {
      expect(PRICES.ADVANCED_PACKAGE).toBe(69000); // 690 THB
      expect(PRICES.POST_EXAM_UPGRADE).toBe(29000); // 290 THB
    });
  });

  describe("Webhook Signature Verification", () => {
    const originalEnv = process.env;

    beforeAll(() => {
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should verify valid webhook signature", () => {
      const payload = JSON.stringify({ type: "payment_intent.succeeded" });
      const signature = "valid_signature";

      // Mock Stripe webhook constructor
      const mockEvent = { type: "payment_intent.succeeded" };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const event = verifyWebhookSignature(payload, signature);

      expect(event).toEqual(mockEvent);
    });

    it("should throw error for invalid signature", () => {
      const payload = JSON.stringify({ type: "payment_intent.succeeded" });
      const signature = "invalid_signature";

      // Mock Stripe webhook constructor to throw error
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      expect(() => verifyWebhookSignature(payload, signature)).toThrow("Invalid webhook signature");
    });
  });
});
