import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordConsent, getUserConsents, consentSchema } from "@/lib/pdpa";
import { csrfProtection } from "@/lib/csrf";
import { z } from "zod";

// GET /api/pdpa/consent - Get user's consent history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consents = await getUserConsents(session.user.id);

    return NextResponse.json({
      success: true,
      data: consents,
    });
  } catch (error) {
    console.error("Error fetching consents:", error);
    return NextResponse.json(
      { error: "Failed to fetch consent history" },
      { status: 500 }
    );
  }
}

// POST /api/pdpa/consent - Record user consent
export async function POST(request: NextRequest) {
  return csrfProtection(request, async (req) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json();

    // Validate request body
    const validatedData = consentSchema.parse({
      ...body,
      userId: session.user.id,
    });

    // Get IP address and user agent from request
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await recordConsent({
      ...validatedData,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: validatedData.granted 
        ? "Consent granted successfully" 
        : "Consent revoked successfully",
    });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.issues },
          { status: 400 }
        );
      }

      console.error("Error recording consent:", error);
      return NextResponse.json(
        { error: "Failed to record consent" },
        { status: 500 }
      );
    }
  });
}