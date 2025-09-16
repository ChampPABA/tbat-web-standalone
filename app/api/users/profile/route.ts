import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withValidation, apiSchemas } from "@/lib/api-validation";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { z } from "zod";

/**
 * GET /api/users/profile
 * Get current user profile
 */
export const GET = withRateLimit(async () => {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    
    const user = await prisma!.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        thaiName: true,
        nationalId: true,
        phone: true,
        school: true,
        packageType: true,
        pdpaConsent: true,
        createdAt: true,
        updatedAt: true,
        // Include related data
        examCodes: {
          select: {
            code: true,
            packageType: true,
            subject: true,
            sessionTime: true,
            createdAt: true,
            usedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        payments: {
          where: { status: "COMPLETED" },
          select: {
            amount: true,
            paymentType: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}, rateLimitConfigs.api);

/**
 * PATCH /api/users/profile
 * Update current user profile with validation
 */
export const PATCH = withRateLimit(async (req: NextRequest) => {
  return withValidation(async (req: NextRequest, data: z.infer<typeof apiSchemas.updateUser>) => {
    try {
      // Get session
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Update user profile
      const updatedUser = await prisma!.user.update({
        where: { email: session.user.email },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          thaiName: true,
          phone: true,
          school: true,
          packageType: true,
          updatedAt: true,
        },
      });

      // Profile update logging would need an admin context, skip for user self-update

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
  }, apiSchemas.updateUser)(req);
}, rateLimitConfigs.api);

/**
 * DELETE /api/users/profile
 * Delete user account (PDPA compliance)
 */
export const DELETE = withRateLimit(async () => {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user to ensure they exist
    const user = await prisma!.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete by anonymizing data (PDPA compliance)
    await prisma!.user.update({
      where: { id: user.id },
      data: {
        email: `deleted_${user.id}@deleted.local`,
        thaiName: "Deleted User",
        phone: null,
        school: null,
        passwordHash: null,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully. Your data has been anonymized per PDPA requirements.",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}, rateLimitConfigs.api);
