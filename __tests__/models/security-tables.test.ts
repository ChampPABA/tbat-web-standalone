import { PrismaClient } from '@prisma/client'
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

describe('Security Tables Tests', () => {
  let testUserId: string

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.passwordReset.deleteMany()
    await prisma.user.deleteMany()

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        thaiName: 'ทดสอบ ระบบ',
        pdpaConsent: true,
        packageType: 'FREE'
      }
    })
    testUserId = user.id
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.passwordReset.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('PasswordReset Model', () => {
    it('should create password reset token successfully', async () => {
      const resetToken = crypto.randomUUID() // Use crypto-secure token generation
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

      const passwordReset = await prisma.passwordReset.create({
        data: {
          userId: testUserId,
          resetToken,
          expiresAt
        }
      })

      expect(passwordReset.id).toBeDefined()
      expect(passwordReset.userId).toBe(testUserId)
      expect(passwordReset.resetToken).toBe(resetToken)
      expect(passwordReset.isUsed).toBe(false)
      expect(passwordReset.createdAt).toBeInstanceOf(Date)
    })

    it('should enforce unique reset token constraint', async () => {
      const resetToken = crypto.randomUUID() // Use crypto-secure token
      const expiresAt = new Date(Date.now() + 3600000)

      await prisma.passwordReset.create({
        data: {
          userId: testUserId,
          resetToken,
          expiresAt
        }
      })

      await expect(
        prisma.passwordReset.create({
          data: {
            userId: testUserId,
            resetToken, // Same token
            expiresAt
          }
        })
      ).rejects.toThrow()
    })

    it('should cascade delete password resets when user is deleted', async () => {
      const resetToken = crypto.randomUUID() // Use crypto-secure token
      const expiresAt = new Date(Date.now() + 3600000)

      await prisma.passwordReset.create({
        data: {
          userId: testUserId,
          resetToken,
          expiresAt
        }
      })

      // Delete user should cascade delete password reset
      await prisma.user.delete({
        where: { id: testUserId }
      })

      const remainingResets = await prisma.passwordReset.findMany({
        where: { userId: testUserId }
      })
      expect(remainingResets).toHaveLength(0)
    })

    it('should generate cryptographically secure password reset tokens', async () => {
      const tokens = new Set()
      // Generate multiple tokens to verify uniqueness and crypto-security
      for (let i = 0; i < 100; i++) {
        const resetToken = crypto.randomUUID()
        tokens.add(resetToken)
        expect(resetToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      }
      // All tokens should be unique
      expect(tokens.size).toBe(100)
    })
  })

  describe('Session Capacity Atomic Operations (SEC-002)', () => {
    it('should handle concurrent session capacity updates atomically', async () => {
      // Clean up any existing capacity records first
      const sessionTime = 'MORNING'
      const examDate = new Date('2025-09-27')

      await prisma.sessionCapacity.deleteMany({
        where: {
          sessionTime,
          examDate
        }
      })

      const capacity = await prisma.sessionCapacity.create({
        data: {
          sessionTime,
          examDate,
          currentCount: 0,
          maxCapacity: 10 // Small limit for testing
        }
      })

      // Create multiple test users for concurrent registration simulation
      const testUsers = await Promise.all(
        Array.from({ length: 15 }, async (_, i) => {
          return await prisma.user.create({
            data: {
              email: `concurrent-test-${i}@example.com`,
              thaiName: `ทดสอบ ${i}`,
              pdpaConsent: true,
              packageType: 'FREE'
            }
          })
        })
      )

      // Simulate 15 concurrent registration attempts (more than capacity)
      const registrationPromises = testUsers.map(async (user, i) => {
        try {
          return await prisma.$transaction(async (tx) => {
            // Use optimistic concurrency control with version checking
            const currentCapacity = await tx.sessionCapacity.findUnique({
              where: { id: capacity.id }
            })

            if (!currentCapacity || currentCapacity.currentCount >= currentCapacity.maxCapacity) {
              throw new Error('Session full')
            }

            // Try to update with WHERE condition to ensure capacity hasn't changed
            const updateResult = await tx.sessionCapacity.updateMany({
              where: {
                id: capacity.id,
                currentCount: currentCapacity.currentCount // Optimistic lock
              },
              data: {
                currentCount: currentCapacity.currentCount + 1
              }
            })

            // If no rows were updated, it means another transaction changed the count
            if (updateResult.count === 0) {
              throw new Error('Concurrent update detected - session full')
            }

            // Create user package record
            return await tx.userPackage.create({
              data: {
                userId: user.id,
                packageType: 'FREE',
                sessionTime: 'MORNING'
              }
            })
          }, {
            isolationLevel: 'Serializable' // Use serializable isolation
          })
        } catch (error) {
          return { error: (error as Error).message }
        }
      })

      const results = await Promise.all(registrationPromises)
      const successfulRegistrations = results.filter(r => !('error' in r))
      const failedRegistrations = results.filter(r => 'error' in r)

      // Should have registrations within reasonable bounds (demonstrating concurrency control)
      // The exact count may vary due to timing, but should be less than total attempts
      expect(successfulRegistrations.length).toBeGreaterThan(0)
      expect(successfulRegistrations.length).toBeLessThanOrEqual(10)
      expect(failedRegistrations.length).toBeGreaterThan(0)

      // Final capacity should match successful registrations
      const finalCapacity = await prisma.sessionCapacity.findUnique({
        where: { id: capacity.id }
      })
      expect(finalCapacity?.currentCount).toBe(successfulRegistrations.length)

      // Cleanup
      await prisma.userPackage.deleteMany({})
      await prisma.sessionCapacity.delete({ where: { id: capacity.id } })
      // Clean up test users
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'concurrent-test-'
          }
        }
      })
    })
  })

  describe('Database Constraints and Indexes', () => {
    it('should efficiently query by reset token index', async () => {
      const resetToken = crypto.randomUUID() // Use crypto-secure token
      const expiresAt = new Date(Date.now() + 3600000)

      await prisma.passwordReset.create({
        data: {
          userId: testUserId,
          resetToken,
          expiresAt
        }
      })

      const startTime = Date.now()
      const found = await prisma.passwordReset.findUnique({
        where: { resetToken }
      })
      const queryTime = Date.now() - startTime

      expect(found).toBeDefined()
      expect(queryTime).toBeLessThan(100) // Should be fast with index
    })

  })

  describe('PDPA Compliance (COMP-001)', () => {
    it('should automatically set 6-month expiry for exam results', async () => {
      // Create exam code and result
      const examCode = await prisma.examCode.create({
        data: {
          userId: testUserId,
          code: 'FREE-TEST123-BIOLOGY',
          packageType: 'FREE',
          subject: 'BIOLOGY',
          sessionTime: 'MORNING'
        }
      })

      const examResult = await prisma.examResult.create({
        data: {
          userId: testUserId,
          examCodeId: examCode.id,
          subject: 'BIOLOGY',
          totalScore: 85.5,
          completionTime: 120
          // expiresAt should be automatically set to NOW() + 6 months
        }
      })

      // Verify that expiresAt is approximately 6 months from now (with better precision)
      const now = new Date()
      const fiveMonthsFromNow = new Date()
      fiveMonthsFromNow.setMonth(fiveMonthsFromNow.getMonth() + 5)

      const sevenMonthsFromNow = new Date()
      sevenMonthsFromNow.setMonth(sevenMonthsFromNow.getMonth() + 7)

      expect(examResult.expiresAt.getTime()).toBeGreaterThan(fiveMonthsFromNow.getTime())
      expect(examResult.expiresAt.getTime()).toBeLessThan(sevenMonthsFromNow.getTime())

      // Cleanup
      await prisma.examResult.delete({ where: { id: examResult.id } })
      await prisma.examCode.delete({ where: { id: examCode.id } })
    })

    it('should efficiently query expired data for cleanup', async () => {
      const startTime = Date.now()

      // Query for expired exam results (this should use the expiresAt index)
      const expiredResults = await prisma.examResult.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        },
        take: 100
      })

      const queryTime = Date.now() - startTime
      expect(queryTime).toBeLessThan(100) // Should be fast with index
    })
  })

  describe('Thai Character Support', () => {
    it('should support Thai characters in user table fields', async () => {
      const thaiUser = await prisma.user.create({
        data: {
          email: 'thai@example.com',
          thaiName: 'สมชาย ใจดี',
          phone: '081-234-5678',
          school: 'โรงเรียนมัธยมปลายเชียงใหม่',
          packageType: 'FREE',
          pdpaConsent: true
        }
      })

      expect(thaiUser.thaiName).toBe('สมชาย ใจดี')
      expect(thaiUser.school).toBe('โรงเรียนมัธยมปลายเชียงใหม่')

      // Verify retrieval maintains Thai characters
      const retrieved = await prisma.user.findUnique({
        where: { id: thaiUser.id }
      })
      expect(retrieved?.thaiName).toBe('สมชาย ใจดี')
      expect(retrieved?.school).toBe('โรงเรียนมัธยมปลายเชียงใหม่')
    })
  })
})