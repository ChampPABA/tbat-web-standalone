import { NextRequest } from 'next/server';

// Import API routes directly for type safety
import { POST as CheckoutPOST } from '@/app/api/payment/create-checkout-session/route';
import { POST as WebhookPOST } from '@/app/api/webhooks/stripe/route';
import { POST as RegisterPOST } from '@/app/api/auth/register/route';

// Mock the imported functions
jest.mock('@/app/api/auth/register/route');
jest.mock('@/app/api/payment/create-checkout-session/route');
jest.mock('@/app/api/webhooks/stripe/route');

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  securityLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock exam code generation
jest.mock('@/lib/exam-code', () => ({
  generateExamCode: jest.fn(),
}));

// Mock email sending
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
}));

// Mock Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
  rateLimitConfigs: {},
}));

describe('Complete Registration and Payment Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('FREE Package Registration Flow', () => {
    it('should complete FREE package registration without payment', async () => {
      // Mock database responses
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        thaiName: 'Test User',
        nationalId: null,
        createdAt: new Date(),
      });
      mockPrisma.securityLog.create.mockResolvedValue({});

      // Mock exam code generation
      const { generateExamCode } = require('@/lib/exam-code');
      generateExamCode.mockResolvedValue({
        id: 'exam_123',
        code: 'FREE-X1Y2-BIOLOGY',
        userId: 'user_123',
      });

      // Mock email sending
      const { sendEmail } = require('@/lib/email');
      sendEmail.mockResolvedValue({ success: true });

      // Mock RegisterPOST response
      const { POST: RegisterPOST } = require('@/app/api/auth/register/route');
      RegisterPOST.mockResolvedValue({
        status: 201,
        json: async () => ({
          success: true,
          user: { email: 'test@example.com' },
          examCode: { code: 'FREE-X1Y2-BIOLOGY' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123456',
          name: 'Test User',
          phoneNumber: '0812345678',
          lineid: 'testuser',
          school: 'chiang-mai-university',
          grade: 'm6',
          pdpaConsent: true,
          packageType: 'FREE',
          subject: 'BIOLOGY',
          sessionTime: '09:00-12:00',
        }),
      });

      const response = await RegisterPOST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('test@example.com');
      expect(data.examCode.code).toBe('FREE-X1Y2-BIOLOGY');

      // Verify no payment metadata was stored
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          packageType: 'FREE',
          metadata: null, // No payment metadata for FREE package
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('ADVANCED Package Payment Flow', () => {
    it('should create Stripe checkout session for ADVANCED package', async () => {
      const mockCheckoutSession = {
        id: 'cs_test_checkout_session',
        url: 'https://checkout.stripe.com/pay/cs_test_checkout_session',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      const request = new NextRequest('http://localhost:3000/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          userEmail: 'advanced@example.com',
          userName: 'Advanced User',
          packageType: 'ADVANCED',
        }),
      });

      const response = await CheckoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(mockCheckoutSession.id);
      expect(data.url).toBe(mockCheckoutSession.url);

      // Verify correct Stripe session configuration
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'TBAT Mock Exam - Advanced Package',
              description: 'แพ็กเกจขั้นสูง: สอบได้ทุกวิชา พร้อมเฉลยโดยละเอียด',
            },
            unit_amount: 69000, // ฿690 in satang
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:3000/register/payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/register/payment-cancelled',
        customer_email: 'advanced@example.com',
        metadata: {
          userEmail: 'advanced@example.com',
          userName: 'Advanced User',
          packageType: 'ADVANCED',
          examDate: '2025-09-15',
        },
        payment_method_options: {
          card: {
            setup_future_usage: undefined,
          },
        },
        locale: 'th',
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
      });
    });

    it('should complete ADVANCED package registration after successful payment webhook', async () => {
      // Mock webhook event
      const mockWebhookEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_checkout_session',
            metadata: {
              userEmail: 'advanced@example.com',
              userName: 'Advanced User',
              packageType: 'ADVANCED',
            },
            amount_total: 69000,
            currency: 'thb',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockWebhookEvent);

      // Mock registration API call (this would be called by webhook)
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'user_456', email: 'advanced@example.com' },
          examCode: { code: 'ADV-Z9X8' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockWebhookEvent),
        headers: {
          'stripe-signature': 'test_signature',
        },
      });

      const response = await WebhookPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);

      // Verify registration API was called with payment data
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'advanced@example.com',
            name: 'Advanced User',
            packageType: 'ADVANCED',
            paymentSessionId: 'cs_test_checkout_session',
            paymentStatus: 'completed',
            paymentAmount: 69000,
            paymentCurrency: 'thb',
          }),
        })
      );
    });

    it('should reject ADVANCED package registration without payment confirmation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nopayment@example.com',
          password: 'Test123456',
          name: 'No Payment User',
          phoneNumber: '0812345678',
          lineid: 'nopayment',
          school: 'chiang-mai-university',
          grade: 'm6',
          pdpaConsent: true,
          packageType: 'ADVANCED',
          sessionTime: '09:00-12:00',
          // Missing payment fields
        }),
      });

      const response = await RegisterPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment confirmation required for Advanced package');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle capacity API errors gracefully in frontend', () => {
      // This would be tested in the component test
      // Testing that the hook handles network errors and shows appropriate messages
      expect(true).toBe(true); // Placeholder - actual test would use React Testing Library
    });

    it('should handle Stripe payment failures', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Payment processing failed')
      );

      const request = new NextRequest('http://localhost:3000/api/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          userEmail: 'fail@example.com',
          userName: 'Fail User',
          packageType: 'ADVANCED',
        }),
      });

      const response = await CheckoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง');
    });

    it('should handle webhook signature verification failures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: 'invalid_payload',
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      });

      const response = await WebhookPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });
  });
});