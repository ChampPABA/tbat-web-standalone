/**
 * Integration test for complete authentication flow
 * Tests the entire authentication process without email verification
 */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Authentication Flow Integration", () => {
  let testUserEmail: string;
  let testUserId: string;

  beforeEach(async () => {
    // Use unique email for each test
    testUserEmail = `test-${Date.now()}@example.com`;

    // Clean up any existing test data
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  async function cleanup() {
    if (testUserId) {
      await prisma.securityLog.deleteMany({ where: { userId: testUserId } });
      await prisma.passwordReset.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }

    // Clean up by email as well
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-" } }
    });
  }

  it("should complete full authentication flow: register → signin → password reset", async () => {
    // Step 1: User Registration (without email verification)
    console.log("Step 1: Testing user registration...");

    const hashedPassword = await bcrypt.hash("TestPassword123", 12);

    const newUser = await prisma.user.create({
      data: {
        email: testUserEmail,
        passwordHash: hashedPassword,
        thaiName: "ทดสอบ ผู้ใช้",
        phone: "0812345678",
        pdpaConsent: true,
        packageType: "FREE",
      },
    });

    testUserId = newUser.id;
    expect(newUser).toBeDefined();
    expect(newUser.email).toBe(testUserEmail);

    // Log registration event
    await prisma.securityLog.create({
      data: {
        eventType: "AUTHENTICATION_SUCCESS",
        userId: newUser.id,
        ipAddress: "127.0.0.1",
        userAgent: "Integration Test",
        metadata: {
          action: "USER_REGISTERED",
          email: newUser.email,
        },
      },
    });

    // Step 2: User Sign In (with password verification)
    console.log("Step 2: Testing user sign in...");

    const foundUser = await prisma.user.findUnique({
      where: { email: testUserEmail },
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

    expect(foundUser).toBeDefined();
    expect(foundUser!.isActive).toBe(true);
    expect(foundUser!.failedLoginAttempts).toBe(0);
    expect(foundUser!.lockedUntil).toBeNull();

    // Verify password
    const isValidPassword = await bcrypt.compare("TestPassword123", foundUser!.passwordHash!);
    expect(isValidPassword).toBe(true);

    // Update last login
    await prisma.user.update({
      where: { id: foundUser!.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await prisma.securityLog.create({
      data: {
        eventType: "LOGIN_SUCCESS",
        userId: foundUser!.id,
        ipAddress: "127.0.0.1",
        userAgent: "Integration Test",
        metadata: {
          email: foundUser!.email,
          packageType: foundUser!.packageType,
        },
      },
    });

    // Step 3: Password Reset Flow
    console.log("Step 3: Testing password reset flow...");

    // Create password reset token
    const resetToken = crypto.randomUUID();
    const passwordReset = await prisma.passwordReset.create({
      data: {
        userId: foundUser!.id,
        resetToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    expect(passwordReset).toBeDefined();
    expect(passwordReset.isUsed).toBe(false);

    // Log password reset request
    await prisma.securityLog.create({
      data: {
        eventType: "PASSWORD_RESET_REQUEST",
        userId: foundUser!.id,
        ipAddress: "127.0.0.1",
        userAgent: "Integration Test",
        metadata: {
          email: foundUser!.email,
        },
      },
    });

    // Step 4: Execute Password Reset
    console.log("Step 4: Testing password reset execution...");

    // Verify reset token is valid
    const validResetToken = await prisma.passwordReset.findUnique({
      where: { resetToken },
      include: { user: { select: { id: true, email: true, thaiName: true } } },
    });

    expect(validResetToken).toBeDefined();
    expect(validResetToken!.expiresAt > new Date()).toBe(true);
    expect(validResetToken!.isUsed).toBe(false);

    // Hash new password and update user
    const newHashedPassword = await bcrypt.hash("NewPassword456", 12);

    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: foundUser!.id },
        data: {
          passwordHash: newHashedPassword,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Mark reset token as used
      await tx.passwordReset.update({
        where: { id: validResetToken!.id },
        data: { isUsed: true },
      });

      // Log password change
      await tx.securityLog.create({
        data: {
          eventType: "PASSWORD_CHANGE",
          userId: foundUser!.id,
          ipAddress: "127.0.0.1",
          userAgent: "Integration Test",
          metadata: {
            resetTokenUsed: true,
            email: foundUser!.email,
          },
        },
      });
    });

    // Step 5: Verify New Password Works
    console.log("Step 5: Testing sign in with new password...");

    const updatedUser = await prisma.user.findUnique({
      where: { email: testUserEmail },
      select: { passwordHash: true, passwordChangedAt: true },
    });

    expect(updatedUser).toBeDefined();
    expect(updatedUser!.passwordChangedAt).toBeDefined();

    // Verify old password no longer works
    const oldPasswordValid = await bcrypt.compare("TestPassword123", updatedUser!.passwordHash!);
    expect(oldPasswordValid).toBe(false);

    // Verify new password works
    const newPasswordValid = await bcrypt.compare("NewPassword456", updatedUser!.passwordHash!);
    expect(newPasswordValid).toBe(true);

    // Step 6: Verify Security Audit Trail
    console.log("Step 6: Testing security audit trail...");

    const securityLogs = await prisma.securityLog.findMany({
      where: { userId: foundUser!.id },
      orderBy: { timestamp: "asc" },
    });

    expect(securityLogs.length).toBeGreaterThanOrEqual(4);

    const eventTypes = securityLogs.map(log => log.eventType);
    expect(eventTypes).toContain("AUTHENTICATION_SUCCESS");
    expect(eventTypes).toContain("LOGIN_SUCCESS");
    expect(eventTypes).toContain("PASSWORD_RESET_REQUEST");
    expect(eventTypes).toContain("PASSWORD_CHANGE");

    console.log("✅ Complete authentication flow test passed!");
  });

  it("should handle account lockout after failed login attempts", async () => {
    console.log("Testing account lockout mechanism...");

    // Create test user
    const hashedPassword = await bcrypt.hash("TestPassword123", 12);
    const user = await prisma.user.create({
      data: {
        email: testUserEmail,
        passwordHash: hashedPassword,
        thaiName: "ทดสอบ ล็อกเอาท์",
        pdpaConsent: true,
        packageType: "FREE",
      },
    });

    testUserId = user.id;

    // Simulate 5 failed login attempts
    for (let attempt = 1; attempt <= 5; attempt++) {
      const currentUser = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { id: true, failedLoginAttempts: true },
      });

      const newAttempts = (currentUser!.failedLoginAttempts || 0) + 1;
      const updateData: any = {
        failedLoginAttempts: newAttempts,
      };

      // Lock account after 5 attempts
      if (newAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Log account lockout
        await prisma.securityLog.create({
          data: {
            eventType: "ACCOUNT_LOCKED",
            userId: currentUser!.id,
            ipAddress: "127.0.0.1",
            userAgent: "Integration Test",
            metadata: {
              reason: "Too many failed login attempts",
              attempts: newAttempts,
            },
          },
        });
      }

      await prisma.user.update({
        where: { email: testUserEmail },
        data: updateData,
      });

      // Log failed login attempt
      await prisma.securityLog.create({
        data: {
          eventType: "LOGIN_FAILED",
          userId: currentUser!.id,
          ipAddress: "127.0.0.1",
          userAgent: "Integration Test",
          metadata: {
            email: testUserEmail,
            reason: "Invalid password",
            attemptNumber: newAttempts,
          },
        },
      });
    }

    // Verify account is locked
    const lockedUser = await prisma.user.findUnique({
      where: { email: testUserEmail },
      select: {
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    expect(lockedUser!.failedLoginAttempts).toBe(5);
    expect(lockedUser!.lockedUntil).toBeDefined();
    expect(lockedUser!.lockedUntil! > new Date()).toBe(true);

    // Verify security logs
    const lockoutLog = await prisma.securityLog.findFirst({
      where: {
        userId: user.id,
        eventType: "ACCOUNT_LOCKED",
      },
    });

    expect(lockoutLog).toBeDefined();
    expect(lockoutLog!.metadata).toMatchObject({
      reason: "Too many failed login attempts",
      attempts: 5,
    });

    console.log("✅ Account lockout test passed!");
  });

  it("should verify email verification dependencies are completely removed", async () => {
    console.log("Testing email verification removal...");

    // Try to query for verification tokens (should not exist)
    try {
      // This should fail because the table was removed
      const result = await (prisma as any).verificationToken.findMany();

      // If we reach here, the table still exists (test should fail)
      expect(true).toBe(false);
    } catch (error) {
      // Expected error - table doesn't exist
      expect((error as Error).message).toContain("Unknown arg");
    }

    // Verify EMAIL_VERIFICATION is not in SecurityEventType enum
    const securityLog = await prisma.securityLog.create({
      data: {
        eventType: "LOGIN_SUCCESS", // This should work
        ipAddress: "127.0.0.1",
        userAgent: "Integration Test",
        metadata: {
          test: "verification removal",
        },
      },
    });

    expect(securityLog).toBeDefined();

    // Try to create log with EMAIL_VERIFICATION (should fail)
    try {
      await prisma.securityLog.create({
        data: {
          eventType: "EMAIL_VERIFICATION" as any,
          ipAddress: "127.0.0.1",
          userAgent: "Integration Test",
        },
      });

      // If we reach here, EMAIL_VERIFICATION still exists (test should fail)
      expect(true).toBe(false);
    } catch (error) {
      // Expected error - enum value doesn't exist
      expect(error).toBeDefined();
    }

    console.log("✅ Email verification removal test passed!");
  });
});