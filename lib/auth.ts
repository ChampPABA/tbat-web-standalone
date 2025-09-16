import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Account lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Password policy
export const PASSWORD_POLICY = {
  minLength: 8,
  requireLetter: true,
  requireNumber: true,
  requireSpecialChar: false, // Simplified for Thai users
  saltRounds: 12,
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }

  if (PASSWORD_POLICY.requireLetter && !/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter");
  }

  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function checkAccountLockout(email: string): Promise<{
  isLocked: boolean;
  remainingTime?: number;
}> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    return { isLocked: false };
  }

  if (user.lockedUntil) {
    const now = new Date();
    if (now < user.lockedUntil) {
      const remainingTime = Math.ceil(
        (user.lockedUntil.getTime() - now.getTime()) / 1000
      );
      return { isLocked: true, remainingTime };
    } else {
      // Lockout expired, reset
      await prisma.user.update({
        where: { email },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }
  }

  return { isLocked: false };
}

export async function recordFailedLogin(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      failedLoginAttempts: true,
    },
  });

  if (!user) return;

  const newAttempts = (user.failedLoginAttempts || 0) + 1;
  const updateData: any = {
    failedLoginAttempts: newAttempts,
  };

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    
    // Security log for account lockout
    await prisma.securityLog.create({
      data: {
        eventType: "ACCOUNT_LOCKED",
        action: "ACCOUNT_LOCKED",
        userId: user.id,
        resourceId: user.id,
        resourceType: "User",
        details: {
          reason: "Too many failed login attempts",
          attempts: newAttempts,
        },
        ipAddress: null,
        userAgent: null,
      },
    });
  }

  await prisma.user.update({
    where: { email },
    data: updateData,
  });
}

export async function resetFailedLoginAttempts(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Dynamic URL configuration - auto-detects port from request headers
  // @ts-ignore - trustHost is supported in runtime but not in types for NextAuth 4.x
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Check account lockout
        const lockoutStatus = await checkAccountLockout(credentials.email);
        if (lockoutStatus.isLocked) {
          const minutes = Math.ceil((lockoutStatus.remainingTime || 0) / 60);
          throw new Error(
            `Account locked. Please try again in ${minutes} minutes. บัญชีถูกล็อก กรุณาลองใหม่ใน ${minutes} นาที`
          );
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.passwordHash) {
          // Record failed attempt even for non-existent users (prevent enumeration)
          await recordFailedLogin(credentials.email);
          throw new Error("Invalid email or password");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          await recordFailedLogin(credentials.email);
          
          // Security log for failed login
          await prisma.securityLog.create({
            data: {
              eventType: "LOGIN_FAILED",
              action: "LOGIN_FAILED",
              userId: user.id,
              resourceId: user.id,
              resourceType: "User",
              details: {
                reason: "Invalid password",
                email: credentials.email,
              },
              ipAddress: null,
              userAgent: null,
            },
          });

          throw new Error("Invalid email or password");
        }

        // Reset failed attempts on successful login
        await resetFailedLoginAttempts(credentials.email);

        // Security log for successful login
        await prisma.securityLog.create({
          data: {
            eventType: "LOGIN_SUCCESS",
            action: "LOGIN_SUCCESS",
            userId: user.id,
            resourceId: user.id,
            resourceType: "User",
            details: {
              email: credentials.email,
            },
            ipAddress: null,
            userAgent: null,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.thaiName,
          thaiName: user.thaiName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;

        // Add thaiName if available
        if ('thaiName' in user) {
          token.thaiName = user.thaiName as string;
        }

        // Fetch additional user data
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            packageType: true,
            isUpgraded: true,
            school: true,
            phone: true,
            thaiName: true,
          },
        });

        if (dbUser) {
          token.packageType = dbUser.packageType;
          token.isUpgraded = dbUser.isUpgraded;
          token.school = dbUser.school;
          token.phone = dbUser.phone;
          token.thaiName = dbUser.thaiName;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.thaiName as string || token.name as string,
          thaiName: token.thaiName as string,
          packageType: token.packageType as any,
          isUpgraded: token.isUpgraded as boolean,
          school: token.school as string,
          phone: token.phone as string,
        };
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper functions for authentication
export async function hashPassword(password: string): Promise<string> {
  // Validate password before hashing
  const validation = validatePassword(password);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(", ")}`);
  }
  
  return bcrypt.hash(password, PASSWORD_POLICY.saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(", "),
      };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Security log
    await prisma.securityLog.create({
      data: {
        eventType: "PASSWORD_CHANGE",
        action: "PASSWORD_CHANGED",
        userId,
        resourceId: userId,
        resourceType: "User",
        details: {
          timestamp: new Date().toISOString(),
        },
        ipAddress: null,
        userAgent: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to change password" };
  }
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, process.env.NEXTAUTH_SECRET!);
}
