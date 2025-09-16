import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportUserData } from "@/lib/pdpa";
import { rateLimitLegacy } from "@/lib/rate-limit";

// Rate limit for PDPA data export (3 requests per 24 hours)
const exportRateLimit = rateLimitLegacy({
  interval: 24 * 60 * 60 * 1000, // 24 hours
  uniqueTokenPerInterval: 500,
  maxRequests: 3,
});

// GET /api/pdpa/export - Export user data
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await exportRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many export requests. Please try again later.",
          errorThai: "คำขอส่งออกข้อมูลมากเกินไป กรุณาลองใหม่ภายหลัง",
        },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get format from query params
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "JSON").toUpperCase() as "JSON" | "CSV";

    if (!["JSON", "CSV"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use JSON or CSV" },
        { status: 400 }
      );
    }

    const exportedData = await exportUserData(session.user.id, format);

    if (format === "CSV") {
      // Return CSV file
      return new NextResponse(exportedData as string, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="user-data-export-${session.user.id}-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      success: true,
      data: exportedData,
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}