import { NextRequest, NextResponse } from "next/server";
import { checkRegistrationEligibility } from "../../../../lib/capacity-management";

/**
 * GET /api/capacity/check - Capacity validation for registration flow (Story 3.1)
 * Validates if registration is allowed without exposing exact capacity numbers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionTime = searchParams.get("sessionTime") as "MORNING" | "AFTERNOON";
    const examDateStr = searchParams.get("examDate");
    const packageType = searchParams.get("packageType") as "FREE" | "ADVANCED";

    if (!sessionTime || !examDateStr || !packageType) {
      return NextResponse.json(
        { error: "sessionTime, examDate, and packageType are required" },
        { status: 400 }
      );
    }

    if (!["MORNING", "AFTERNOON"].includes(sessionTime)) {
      return NextResponse.json(
        { error: "sessionTime must be MORNING or AFTERNOON" },
        { status: 400 }
      );
    }

    if (!["FREE", "ADVANCED"].includes(packageType)) {
      return NextResponse.json(
        { error: "packageType must be FREE or ADVANCED" },
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

    // Check registration eligibility using Story 3.1 algorithm
    const eligibility = await checkRegistrationEligibility(sessionTime, examDate, packageType);

    return NextResponse.json({
      success: true,
      data: {
        allowed: eligibility.allowed,
        reason: eligibility.reason,
        session_time: sessionTime,
        package_type: packageType,
        exam_date: examDateStr,
        // Include UI-safe capacity status
        availability_status: eligibility.capacity.is_full ? "FULL" :
                           !eligibility.capacity.free_slots_available && packageType === "FREE" ? "LIMITED" :
                           "AVAILABLE",
        can_register: eligibility.allowed,
      },
    });
  } catch (error) {
    console.error("Error checking capacity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}