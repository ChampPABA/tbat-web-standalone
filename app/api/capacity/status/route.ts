import { NextRequest, NextResponse } from "next/server";
import { getCapacityStatusForUI } from "../../../../lib/capacity-management";

/**
 * GET /api/capacity/status - Real-time availability without numbers (Story 3.1 AC5)
 * Returns capacity status compliant with UI rule: never show exact numbers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionTime = searchParams.get("sessionTime") as "MORNING" | "AFTERNOON";
    const examDateStr = searchParams.get("examDate");

    if (!sessionTime || !examDateStr) {
      return NextResponse.json(
        { error: "sessionTime and examDate are required" },
        { status: 400 }
      );
    }

    if (!["MORNING", "AFTERNOON"].includes(sessionTime)) {
      return NextResponse.json(
        { error: "sessionTime must be MORNING or AFTERNOON" },
        { status: 400 }
      );
    }

    const examDate = new Date(examDateStr);
    if (isNaN(examDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid examDate format" },
        { status: 400 }
      );
    }

    // Get capacity status without exposing exact numbers
    const status = await getCapacityStatusForUI(sessionTime, examDate);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error getting capacity status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}