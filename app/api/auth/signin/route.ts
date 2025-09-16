import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkAccountLockout, recordFailedLogin, resetFailedLoginAttempts, passwordSchema } from "@/lib/auth";

// Validation schema for sign in
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

/**
 * POST /api/auth/signin
 * Custom sign in endpoint with rate limiting and validation
 */
export const POST = withRateLimit(
  async (req: NextRequest) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = signInSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const { email, password } = validation.data;
      const normalizedEmail = email.toLowerCase();

      // Check database availability
      if (!prisma) {
        return NextResponse.json({ error: "Database not available" }, { status: 503 });
      }

      // Check account lockout first
      const lockoutStatus = await checkAccountLockout(normalizedEmail);
      if (lockoutStatus.isLocked) {
        const minutes = Math.ceil((lockoutStatus.remainingTime || 0) / 60);
        return NextResponse.json(
          {
            error: "Account temporarily locked due to multiple failed login attempts",
            message: `บัญชีถูกล็อกชั่วคราวเนื่องจากการเข้าสู่ระบบผิดหลายครั้ง กรุณาลองใหม่ใน ${minutes} นาที`,
            retryAfter: lockoutStatus.remainingTime
          },
          { status: 423 } // 423 Locked
        );
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          thaiName: true,
          packageType: true,
          isActive: true,
          failedLoginAttempts: true,
          lockedUntil: true
        }
      });

      if (!user || !user.passwordHash) {
        // Record failed attempt for non-existent users to prevent enumeration
        await recordFailedLogin(normalizedEmail);

        // Log failed login attempt
        await prisma.securityLog.create({
          data: {
            eventType: "LOGIN_FAILED",
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            metadata: {
              email: normalizedEmail,
              reason: "User not found",
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Use generic error message to prevent user enumeration
        return NextResponse.json(
          { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid email or password)" },
          { status: 401 }
        );
      }

      // Check if account is active
      if (!user.isActive) {
        return NextResponse.json(
          { error: "บัญชีของคุณถูกปิดการใช้งาน (Your account has been deactivated)" },
          { status: 403 }
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        // Record failed login attempt
        await recordFailedLogin(normalizedEmail);

        // Enhanced security logging for failed password attempts
        await prisma.securityLog.create({
          data: {
            eventType: "LOGIN_FAILED",
            userId: user.id,
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            metadata: {
              email: normalizedEmail,
              reason: "Invalid password",
              attemptNumber: (user.failedLoginAttempts || 0) + 1,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return NextResponse.json(
          { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง (Invalid email or password)" },
          { status: 401 }
        );
      }

      // Success! Reset failed login attempts and update last login
      await resetFailedLoginAttempts(normalizedEmail);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Enhanced security logging for successful login
      await prisma.securityLog.create({
        data: {
          eventType: "LOGIN_SUCCESS",
          userId: user.id,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          metadata: {
            email: normalizedEmail,
            packageType: user.packageType,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Return success with user info (excluding sensitive data) with proper UTF-8 encoding
      return new NextResponse(
        JSON.stringify({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            thaiName: user.thaiName,
            packageType: user.packageType,
          },
          message: "เข้าสู่ระบบสำเร็จ (Sign in successful. Use NextAuth session for authentication.)",
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    } catch (error) {
      console.error("Sign in error:", error);

      // Log security event for authentication failure
      try {
        await prisma?.securityLog.create({
          data: {
            eventType: "AUTHENTICATION_FAILED",
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            metadata: {
              action: "SIGNIN_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (logError) {
        console.error("Failed to log security event:", logError);
      }

      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ (An error occurred during sign in)" },
        { status: 500 }
      );
    }
  },
  rateLimitConfigs.auth // Apply auth rate limiting
);
