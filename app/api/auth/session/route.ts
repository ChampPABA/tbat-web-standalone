import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/auth/session
 * Get current session information for custom AuthProvider
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Calculate session expiry (7 days from now as configured in NextAuth)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();

    // Calculate remaining time
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    let timeRemaining = '';
    if (hours > 0) {
      timeRemaining = `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
      timeRemaining = `${minutes} นาที`;
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        thaiName: session.user.name,
        packageType: (session.user as any).packageType || 'FREE',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
      },
      expiresAt: expiresAt.toISOString(),
      timeRemaining
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}