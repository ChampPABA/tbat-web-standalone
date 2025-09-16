import { NextRequest } from 'next/server';

// Mock Stripe with proper typing
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

// Import POST function directly
import { POST } from '@/app/api/payment/create-checkout-session/route';

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    STRIPE_SECRET_KEY: 'sk_test_mock_key',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe('/api/payment/create-checkout-session', () => {
  it('should create checkout session for valid Advanced package request', async () => {
    const mockSession = {
      id: 'cs_test_mock_session_id',
      url: 'https://checkout.stripe.com/pay/cs_test_mock_session_id',
    };

    mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/payment/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'test@example.com',
        userName: 'Test User',
        packageType: 'ADVANCED',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sessionId).toBe(mockSession.id);
    expect(data.url).toBe(mockSession.url);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'TBAT Mock Exam - Advanced Package',
              description: 'แพ็กเกจขั้นสูง: สอบได้ทุกวิชา พร้อมเฉลยโดยละเอียด',
            },
            unit_amount: 69000, // ฿690 in satang
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/register/payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/register/payment-cancelled',
      customer_email: 'test@example.com',
      metadata: {
        userEmail: 'test@example.com',
        userName: 'Test User',
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

  it('should reject requests for FREE package type', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'test@example.com',
        userName: 'Test User',
        packageType: 'FREE',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields or invalid package type');
  });

  it('should handle missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'test@example.com',
        // Missing userName and packageType
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields or invalid package type');
  });

  it('should handle Stripe errors gracefully', async () => {
    const Stripe = require('stripe');
    const mockStripe = new Stripe();
    mockStripe.checkout.sessions.create.mockRejectedValue(
      new Error('Something went wrong')
    );

    const request = new NextRequest('http://localhost:3000/api/payment/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        userEmail: 'test@example.com',
        userName: 'Test User',
        packageType: 'ADVANCED',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง');
  });
});