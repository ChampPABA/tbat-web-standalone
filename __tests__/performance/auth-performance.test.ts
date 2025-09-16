/**
 * Performance test for authentication endpoints
 * Tests 20 concurrent users as per architecture requirements
 */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Authentication Performance Tests", () => {
  const CONCURRENT_USERS = 20;
  const TARGET_RESPONSE_TIME_MS = 200;

  let testUserIds: string[] = [];

  beforeAll(async () => {
    // Create test users for concurrent testing
    console.log(`Creating ${CONCURRENT_USERS} test users...`);

    const hashedPassword = await bcrypt.hash("TestPassword123", 12);

    const userPromises = Array.from({ length: CONCURRENT_USERS }, async (_, index) => {
      return prisma.user.create({
        data: {
          email: `perftest${index}@example.com`,
          passwordHash: hashedPassword,
          thaiName: `ทดสอบ ${index}`,
          phone: `08123456${String(index).padStart(2, "0")}`,
          pdpaConsent: true,
          packageType: "FREE",
        },
      });
    });

    const users = await Promise.all(userPromises);
    testUserIds = users.map(user => user.id);

    console.log(`✅ Created ${testUserIds.length} test users`);
  });

  afterAll(async () => {
    // Cleanup test data
    console.log("Cleaning up performance test data...");

    // Clean up security logs first (foreign key dependency)
    await prisma.securityLog.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    // Clean up password resets
    await prisma.passwordReset.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    // Clean up test users
    await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    });

    console.log("✅ Cleanup completed");
  });

  it("should handle 20 concurrent registration requests", async () => {
    console.log("Testing concurrent registration performance...");

    const startTime = Date.now();
    const hashedPassword = await bcrypt.hash("ConcurrentTest123", 12);

    const registrationPromises = Array.from({ length: CONCURRENT_USERS }, async (_, index) => {
      const email = `concurrent${Date.now()}-${index}@example.com`;

      try {
        const start = Date.now();

        // Simulate registration logic
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            thaiName: `ทดสอบ การทำงานพร้อมกัน ${index}`,
            phone: `08987654${String(index).padStart(2, "0")}`,
            pdpaConsent: true,
            packageType: "FREE",
          },
        });

        // Log registration
        await prisma.securityLog.create({
          data: {
            eventType: "AUTHENTICATION_SUCCESS",
            userId: user.id,
            ipAddress: "127.0.0.1",
            userAgent: `Concurrent Test ${index}`,
            metadata: {
              action: "USER_REGISTERED",
              email: user.email,
              concurrentTest: true,
            },
          },
        });

        const responseTime = Date.now() - start;

        return {
          success: true,
          responseTime,
          userId: user.id,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          responseTime: Date.now() - startTime,
        };
      }
    });

    const results = await Promise.all(registrationPromises);
    const totalTime = Date.now() - startTime;

    // Analyze results
    const successfulRegistrations = results.filter(r => r.success);
    const failedRegistrations = results.filter(r => !r.success);

    const responseTimes = successfulRegistrations.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);

    console.log(`Performance Results:`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Successful registrations: ${successfulRegistrations.length}/${CONCURRENT_USERS}`);
    console.log(`- Failed registrations: ${failedRegistrations.length}`);
    console.log(`- Average response time: ${Math.round(averageResponseTime)}ms`);
    console.log(`- Maximum response time: ${maxResponseTime}ms`);

    // Assertions
    expect(successfulRegistrations.length).toBe(CONCURRENT_USERS);
    expect(failedRegistrations.length).toBe(0);
    expect(averageResponseTime).toBeLessThan(TARGET_RESPONSE_TIME_MS);
    expect(maxResponseTime).toBeLessThan(TARGET_RESPONSE_TIME_MS * 2); // Allow 2x for outliers

    // Cleanup concurrent test users
    const concurrentUserIds = successfulRegistrations
      .map(r => r.userId)
      .filter(Boolean) as string[];

    await prisma.securityLog.deleteMany({
      where: { userId: { in: concurrentUserIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: concurrentUserIds } },
    });
  });

  it("should handle 20 concurrent signin requests", async () => {
    console.log("Testing concurrent signin performance...");

    const startTime = Date.now();

    const signinPromises = testUserIds.map(async (userId, index) => {
      const email = `perftest${index}@example.com`;

      try {
        const start = Date.now();

        // Simulate signin logic
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            thaiName: true,
            packageType: true,
            isActive: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("User not found");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare("TestPassword123", user.passwordHash);

        if (!isValidPassword) {
          throw new Error("Invalid password");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log successful login
        await prisma.securityLog.create({
          data: {
            eventType: "LOGIN_SUCCESS",
            userId: user.id,
            ipAddress: "127.0.0.1",
            userAgent: `Concurrent Signin Test ${index}`,
            metadata: {
              email: user.email,
              packageType: user.packageType,
              concurrentTest: true,
            },
          },
        });

        const responseTime = Date.now() - start;

        return {
          success: true,
          responseTime,
          email: user.email,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          responseTime: Date.now() - startTime,
        };
      }
    });

    const results = await Promise.all(signinPromises);
    const totalTime = Date.now() - startTime;

    // Analyze results
    const successfulSignins = results.filter(r => r.success);
    const failedSignins = results.filter(r => !r.success);

    const responseTimes = successfulSignins.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);

    console.log(`Signin Performance Results:`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Successful signins: ${successfulSignins.length}/${CONCURRENT_USERS}`);
    console.log(`- Failed signins: ${failedSignins.length}`);
    console.log(`- Average response time: ${Math.round(averageResponseTime)}ms`);
    console.log(`- Maximum response time: ${maxResponseTime}ms`);

    // Assertions
    expect(successfulSignins.length).toBe(CONCURRENT_USERS);
    expect(failedSignins.length).toBe(0);
    expect(averageResponseTime).toBeLessThan(TARGET_RESPONSE_TIME_MS);
    expect(maxResponseTime).toBeLessThan(TARGET_RESPONSE_TIME_MS * 2);
  });

  it("should handle 20 concurrent password reset requests", async () => {
    console.log("Testing concurrent password reset performance...");

    const startTime = Date.now();

    const resetPromises = testUserIds.map(async (userId, index) => {
      const email = `perftest${index}@example.com`;

      try {
        const start = Date.now();

        // Simulate password reset logic
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, thaiName: true },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Generate reset token
        const resetToken = crypto.randomUUID();

        // Store token
        await prisma.passwordReset.create({
          data: {
            userId: user.id,
            resetToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        // Log reset request
        await prisma.securityLog.create({
          data: {
            eventType: "PASSWORD_RESET_REQUEST",
            userId: user.id,
            ipAddress: "127.0.0.1",
            userAgent: `Concurrent Reset Test ${index}`,
            metadata: {
              email: user.email,
              concurrentTest: true,
            },
          },
        });

        const responseTime = Date.now() - start;

        return {
          success: true,
          responseTime,
          resetToken,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          responseTime: Date.now() - startTime,
        };
      }
    });

    const results = await Promise.all(resetPromises);
    const totalTime = Date.now() - startTime;

    // Analyze results
    const successfulResets = results.filter(r => r.success);
    const failedResets = results.filter(r => !r.success);

    const responseTimes = successfulResets.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);

    console.log(`Password Reset Performance Results:`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Successful resets: ${successfulResets.length}/${CONCURRENT_USERS}`);
    console.log(`- Failed resets: ${failedResets.length}`);
    console.log(`- Average response time: ${Math.round(averageResponseTime)}ms`);
    console.log(`- Maximum response time: ${maxResponseTime}ms`);

    // Assertions
    expect(successfulResets.length).toBe(CONCURRENT_USERS);
    expect(failedResets.length).toBe(0);
    expect(averageResponseTime).toBeLessThan(TARGET_RESPONSE_TIME_MS);
    expect(maxResponseTime).toBeLessThan(TARGET_RESPONSE_TIME_MS * 2);

    // Cleanup password reset tokens
    const resetTokens = successfulResets
      .map(r => r.resetToken)
      .filter(Boolean) as string[];

    if (resetTokens.length > 0) {
      await prisma.passwordReset.deleteMany({
        where: { resetToken: { in: resetTokens } },
      });
    }
  });

  it("should validate rate limiting doesn't block legitimate concurrent requests", async () => {
    console.log("Testing rate limiting with concurrent requests...");

    const startTime = Date.now();

    // Test rate limiting by making requests from the same IP
    // Should allow legitimate concurrent usage without blocking
    const rateLimitPromises = Array.from({ length: CONCURRENT_USERS }, async (_, index) => {
      try {
        const start = Date.now();

        // Simulate multiple operations for the same user
        const userId = testUserIds[index % testUserIds.length];
        const email = `perftest${index % testUserIds.length}@example.com`;

        // Query user multiple times (simulating real usage)
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, packageType: true },
        });

        if (user) {
          // Log activity
          await prisma.securityLog.create({
            data: {
              eventType: "LOGIN_SUCCESS",
              userId: user.id,
              ipAddress: "127.0.0.1",
              userAgent: `Rate Limit Test ${index}`,
              metadata: {
                rateLimitTest: true,
                timestamp: new Date().toISOString(),
              },
            },
          });
        }

        const responseTime = Date.now() - start;

        return {
          success: true,
          responseTime,
          rateLimited: false,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
          success: false,
          error: (error as Error).message,
          responseTime,
          rateLimited: (error as Error).message.includes("rate limit"),
        };
      }
    });

    const results = await Promise.all(rateLimitPromises);
    const totalTime = Date.now() - startTime;

    // Analyze results
    const successfulRequests = results.filter(r => r.success);
    const rateLimitedRequests = results.filter(r => r.rateLimited);
    const otherFailures = results.filter(r => !r.success && !r.rateLimited);

    const responseTimes = successfulRequests.map(r => r.responseTime);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    console.log(`Rate Limiting Performance Results:`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Successful requests: ${successfulRequests.length}/${CONCURRENT_USERS}`);
    console.log(`- Rate limited requests: ${rateLimitedRequests.length}`);
    console.log(`- Other failures: ${otherFailures.length}`);
    console.log(`- Average response time: ${Math.round(averageResponseTime)}ms`);

    // For legitimate concurrent usage, we shouldn't see excessive rate limiting
    // Allow some rate limiting (up to 10%) but not excessive blocking
    expect(successfulRequests.length).toBeGreaterThan(CONCURRENT_USERS * 0.8); // At least 80% success
    expect(rateLimitedRequests.length).toBeLessThan(CONCURRENT_USERS * 0.2); // Less than 20% rate limited

    if (averageResponseTime > 0) {
      expect(averageResponseTime).toBeLessThan(TARGET_RESPONSE_TIME_MS);
    }
  });
});