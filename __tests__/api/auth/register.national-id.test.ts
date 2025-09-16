/**
 * Integration tests for National ID functionality in registration API
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    securityLog: {
      create: jest.fn()
    }
  }
}));

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('@/lib/exam-code', () => ({
  generateExamCode: jest.fn().mockResolvedValue({
    code: 'FREE-TEST-BIOLOGY',
    packageType: 'FREE',
    subject: 'BIOLOGY',
    generatedAt: new Date().toISOString()
  })
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password')
}));

import { prisma } from '@/lib/prisma';

describe('POST /api/auth/register - National ID Integration', () => {
  const validRequestData = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    thaiName: 'นายทดสอบ',
    nickname: 'Test',
    phoneNumber: '0812345678',
    lineid: '@testuser',
    school: 'montfort',
    grade: 'm6',
    pdpaConsent: true,
    packageType: 'FREE',
    subject: 'BIOLOGY',
    sessionTime: '09:00-12:00'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      thaiName: 'นายทดสอบ',
      nationalId: null,
      createdAt: new Date()
    });
    (prisma.securityLog.create as jest.Mock).mockResolvedValue({});
  });

  describe('Valid National ID Registration', () => {
    test('should register user with valid National ID', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '1234567890123' // Valid checksum
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nationalId: '1234567890123',
            email: 'test@example.com'
          })
        })
      );
      expect(prisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'NATIONAL_ID_VALIDATION_SUCCESS'
          })
        })
      );
    });

    test('should register user without National ID (optional field)', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nationalId: null,
            email: 'test@example.com'
          })
        })
      );
    });

    test('should clean and store National ID properly', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '123-45678-90-123' // Formatted input
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nationalId: '1234567890123' // Should be cleaned
          })
        })
      );
    });
  });

  describe('Invalid National ID Registration', () => {
    test('should reject invalid National ID format', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '12345' // Too short
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Validation failed');
      expect(result.details.fieldErrors.nationalId).toContain(
        'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
      );
    });

    test('should reject National ID with invalid checksum', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '1234567890124' // Invalid checksum
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Validation failed');
      expect(result.details.fieldErrors.nationalId).toContain(
        'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
      );
    });

    test('should reject National ID starting with 0', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '0234567890123' // Starts with 0
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('Duplicate National ID Handling', () => {
    test('should reject duplicate National ID', async () => {
      // Mock existing user with same National ID
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // First call for email check
        .mockResolvedValueOnce({ // Second call for National ID check
          id: 'existing-user-id',
          nationalId: '1234567890123'
        });

      const requestData = {
        ...validRequestData,
        nationalId: '1234567890123'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.error).toBe('เลขบัตรประชาชนนี้ถูกใช้งานแล้ว กรุณาติดต่อฝ่ายสนับสนุน');
      expect(result.errorCode).toBe('DUPLICATE_NATIONAL_ID');
      expect(prisma.user.create).not.toHaveBeenCalled();

      // Should log duplicate attempt
      expect(prisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'NATIONAL_ID_DUPLICATE_ATTEMPT'
          })
        })
      );
    });

    test('should allow same National ID if first user registration fails', async () => {
      // Mock database constraint failure scenario
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const requestData = {
        ...validRequestData,
        nationalId: '1234567890123'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Security Logging', () => {
    test('should log successful National ID validation', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '1234567890123'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-agent'
        },
        body: JSON.stringify(requestData)
      });

      await POST(request);

      expect(prisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'NATIONAL_ID_VALIDATION_SUCCESS',
            ipAddress: '192.168.1.1',
            userAgent: 'test-agent',
            metadata: expect.objectContaining({
              action: 'NATIONAL_ID_VALIDATED'
            })
          })
        })
      );
    });

    test('should include National ID flag in registration log', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '1234567890123'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      await POST(request);

      expect(prisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'AUTHENTICATION_SUCCESS',
            metadata: expect.objectContaining({
              nationalIdProvided: true
            })
          })
        })
      );
    });

    test('should set National ID flag to false when not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequestData)
      });

      await POST(request);

      expect(prisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'AUTHENTICATION_SUCCESS',
            metadata: expect.objectContaining({
              nationalIdProvided: false
            })
          })
        })
      );
    });
  });

  describe('Data Validation Edge Cases', () => {
    test('should handle empty string National ID', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: ''
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nationalId: null
          })
        })
      );
    });

    test('should handle whitespace-only National ID', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '   '
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.details.fieldErrors.nationalId).toBeDefined();
    });

    test('should handle National ID with mixed formatting characters', async () => {
      const requestData = {
        ...validRequestData,
        nationalId: '123 456-78.90123'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nationalId: '1234567890123'
          })
        })
      );
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain compatibility with existing user registration flow', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequestData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.examCode).toBeDefined();
    });

    test('should not affect existing validation for required fields', async () => {
      const invalidData = { ...validRequestData };
      delete (invalidData as any).email;

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Validation failed');
    });
  });
});